import { workerData } from "worker_threads";
import { EVENT_STORAGE, FRAGMENT_STORAGE, FRAGMENTATION_STORAGE, LOGGER } from "../config";
import EntityStatus from "../entities/EntityStatus";
import Fragmentation from "../entities/Fragmentation";
import createStrategy from "../util/createStrategy";
import Fragment from "../entities/Fragment";
import RDFEvent from "../entities/Event";
import FragmentChain from "../entities/FragmentChain";

const fragmentation: Fragmentation = workerData.fragmentation;
const storage = EVENT_STORAGE;
const fragmentStorage = FRAGMENT_STORAGE;

let inFlight = 0;
async function addFragmentChain(event: RDFEvent, chain: FragmentChain, first: boolean) {
    // write with backpressure
    const fragment = chain.fragment;

    inFlight++;
    const p = storage
        .addToBucket(fragment.streamID, fragment.fragmentName, fragment.value, event)
        .then(() => inFlight--);

    if (first) {
        inFlight++;
        await fragmentStorage.addRoot(chain.fragment).then(() => inFlight--);
    }

    if (inFlight > 0) {
        await p;
    }

    for (const child of chain.children) {
        inFlight++;
        fragmentStorage
            .addRelation(fragment, child.fragment)
            .then(() => inFlight--);
        addFragmentChain(event, child, false);
    }
}

async function doStuff() {
    const startTime = new Date();
    const bucketStrategy = createStrategy(fragmentation);

    let i = 0;
    for await (const event of storage.getAllByStream(fragmentation.streamID)) {
        if (new Date(event.timestamp) >= startTime) {
            // we assume all new events are already processed
            break;
        }

        for (const chain of bucketStrategy.labelObject(event)) {
            await addFragmentChain(event, chain, true);
        }
        i++;

        if (i % 1000 === 0) {
            LOGGER.info(`${fragmentation.streamID} - ${fragmentation.name} processed ${i} events`);
        }
    }

    fragmentation.status = EntityStatus.DISABLED;
    FRAGMENTATION_STORAGE.add(fragmentation);
}

doStuff();

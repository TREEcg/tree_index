import { workerData } from "worker_threads";
import { EVENT_STORAGE, FRAGMENT_STORAGE, FRAGMENTATION_STORAGE, LOGGER } from "../config";
import EntityStatus from "../entities/EntityStatus";
import Fragmentation from "../entities/Fragmentation";
import createStrategy from "../util/createStrategy";

const fragmentation: Fragmentation = workerData.fragmentation;
const storage = EVENT_STORAGE;
const fragmentStorage = FRAGMENT_STORAGE;

async function doStuff() {
    const startTime = new Date();
    const bucketStrategy = createStrategy(fragmentation);
    let i = 0;

    for await (const event of storage.getAllByStream(fragmentation.streamID)) {
        if (new Date(event.timestamp) >= startTime) {
            // we assume all new events are already processed
            break;
        }
        // write with backpressure
        let inFlight = 0;
        for (const b of bucketStrategy.labelObject(event)) {
            inFlight += 2;
            const p = storage.addToBucket(b.streamID, b.fragmentName, b.value, event)
                .then(() => inFlight--);
            fragmentStorage.add(b).then(() => inFlight--);
            if (inFlight > 10) {
                await p;
            }
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

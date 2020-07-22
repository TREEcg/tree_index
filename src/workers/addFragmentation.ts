import { workerData } from "worker_threads";
import { EVENT_STORAGE, FRAGMENTATION_STORAGE, LOGGER } from "../config";
import EntityStatus from "../entities/EntityStatus";
import Fragmentation from "../entities/Fragmentation";
import createStrategy from "../util/createStrategy";

const fragmentation: Fragmentation = workerData.fragmentation;
const storage = EVENT_STORAGE;

async function doStuff() {
    const bucketStrategy = createStrategy(fragmentation);
    let i = 0;

    for await (const event of storage.getAllByStream(fragmentation.streamID)) {
        // write with backpressure
        let inFlight = 0;
        for (const b of bucketStrategy.labelObject(event)) {
            const p = storage.addToBucket(b.streamID, b.fragmentName, b.value, event)
                .then(() => inFlight--);
            if (inFlight > 10) {
                await p;
            }
        }
        i++;

        if (i % 1000 === 0) {
            console.log(i)
            LOGGER.info(`${fragmentation.streamID} - ${fragmentation.name} processed ${i} events`);
        }
    }

    fragmentation.status = EntityStatus.DISABLED;
    FRAGMENTATION_STORAGE.add(fragmentation);
}

doStuff();

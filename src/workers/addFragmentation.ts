import { workerData } from "worker_threads";
import { EVENT_STORAGE } from "../config";
import createStrategy from "../util/createStrategy";

const fragmentation = JSON.parse(workerData.fragmentation);
const storage = EVENT_STORAGE;

async function doStuff() {
    const bucketStrategy = createStrategy(fragmentation);
    console.log(new Date());
    let i = 0;
    for await (const event of storage.getAllByStream("https://streams.datapiloten.be/sensors")) {
        for (const bucket of bucketStrategy.labelObject(event)) {
            await storage.addToBucket(bucket.streamID, bucket.fragmentName, bucket.value, event);
        }
        i += 1;
        if (i % 1000 === 0) {
            console.log(new Date(), i / 1000);
        }
    }
}

doStuff();

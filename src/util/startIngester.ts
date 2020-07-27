import path = require("path");
import { Worker } from "worker_threads";
import { URI } from "./constants";

export default function startIngester(source: URI) {
    // start ingesting this stream if it is new
    // OR resume ingesting if this stream exists with the same name
    const workerPath = path.resolve(__dirname, "../workers/startIngester.js");

    // tslint:disable-next-line: no-unused-expression
    new Worker(workerPath, {
        workerData: {
            uri: source,
            frequency: 60 * 1000, // 1 minute
        },
    });
}

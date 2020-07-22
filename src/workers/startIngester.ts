import { workerData } from "worker_threads";
import { EVENT_STORAGE, FRAGMENT_STORAGE, FRAGMENTATION_STORAGE, STATE_STORAGE, STREAM_STORAGE } from "../config";
import EventStreamIngester from "../ingesters/EventStreamIngester";

const source = workerData.uri;
const frequency = workerData.frequency;
const stateStorage = STATE_STORAGE;

// it's not unused, it's just a looping thing
// tslint:disable-next-line: no-unused-expression
new EventStreamIngester(
    source, frequency, stateStorage, STREAM_STORAGE,
    FRAGMENTATION_STORAGE, FRAGMENT_STORAGE, EVENT_STORAGE,
);

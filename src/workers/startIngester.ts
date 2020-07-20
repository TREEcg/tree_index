const { workerData } = require('worker_threads');
import { EVENT_STORAGE, FRAGMENT_STORAGE, FRAGMENTATION_STORAGE, STREAM_STORAGE } from "../config";
import EventStreamIngester from "../ingesters/EventStreamIngester";
import DummyStateStorage from "../state/DummyStateStorage";

const source = workerData.uri;
const frequency = workerData.frequency;
const stateStorage = new DummyStateStorage();

new EventStreamIngester(
    source, frequency, stateStorage, STREAM_STORAGE,
    FRAGMENTATION_STORAGE, FRAGMENT_STORAGE, EVENT_STORAGE,
);

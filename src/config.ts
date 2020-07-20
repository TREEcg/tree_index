import cassandra = require("cassandra-driver");
import CassandraFragmentationStorage from "./persistence/fragmentations/CassandraFragmentationStorage";
import CassandraFragmentStorage from "./persistence/fragments/CassandraFragmentStorage";
import CassandraEventStreamStorage from "./persistence/streams/CassandraEventStreamStorage";
import DummyStageStorage from "./state/DummyStateStorage";
import CassandraEventStorage from "./persistence/events/CassandraEventStorage";

const streamState = new DummyStageStorage();
const fragmentationState = new DummyStageStorage();
const eventState = new DummyStageStorage();

const cassandraClient = new cassandra.Client({
    contactPoints: ["172.17.0.2:9042"],
    localDataCenter: "datacenter1",
    pooling: {
        maxRequestsPerConnection: 32768,
    },
});

export const STREAM_STORAGE = new CassandraEventStreamStorage(streamState, cassandraClient);
export const FRAGMENTATION_STORAGE = new CassandraFragmentationStorage(fragmentationState, cassandraClient);
export const FRAGMENT_STORAGE = new CassandraFragmentStorage(cassandraClient);
export const EVENT_STORAGE = new CassandraEventStorage(cassandraClient);

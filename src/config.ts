import cassandra = require("cassandra-driver");
import CassandraFragmentationStorage from "./persistence/fragmentations/CassandraFragmentationStorage";
import CassandraEventStreamStorage from "./persistence/streams/CassandraEventStreamStorage";
import DummyStageStorage from "./state/DummyStateStorage";

const streamState = new DummyStageStorage();
const fragmentationState = new DummyStageStorage();

const cassandraClient = new cassandra.Client({
    contactPoints: ["172.17.0.2:9042"],
    localDataCenter: "datacenter1",
});

export const STREAM_STORAGE = new CassandraEventStreamStorage(streamState, cassandraClient);
export const FRAGMENTATION_STORAGE = new CassandraFragmentationStorage(fragmentationState, cassandraClient);

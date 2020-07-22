import cassandra = require("cassandra-driver");
import pino = require("pino");
import CassandraEventStorage from "./persistence/events/CassandraEventStorage";
import CassandraFragmentationStorage from "./persistence/fragmentations/CassandraFragmentationStorage";
import CassandraFragmentStorage from "./persistence/fragments/CassandraFragmentStorage";
import CassandraStateStorage from "./persistence/state/CassandraStateStorage";
import CassandraEventStreamStorage from "./persistence/streams/CassandraEventStreamStorage";

const cassandraClient = new cassandra.Client({
    contactPoints: ["172.17.0.2:9042"],
    localDataCenter: "datacenter1",
    pooling: {
        maxRequestsPerConnection: 32768,
    },
});

export const LOGGER = pino({ level: process.env.LOG_LEVEL || "info" });
export const STREAM_STORAGE = new CassandraEventStreamStorage(cassandraClient);
export const FRAGMENTATION_STORAGE = new CassandraFragmentationStorage(cassandraClient);
export const FRAGMENT_STORAGE = new CassandraFragmentStorage(cassandraClient);
export const EVENT_STORAGE = new CassandraEventStorage(cassandraClient);
export const STATE_STORAGE = new CassandraStateStorage(cassandraClient);

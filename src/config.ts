import cassandra = require("cassandra-driver");
import pino = require("pino");
import CassandraEventStorage from "./persistence/events/CassandraEventStorage";
import CassandraFragmentationStorage from "./persistence/fragmentations/CassandraFragmentationStorage";
import CassandraFragmentStorage from "./persistence/fragments/CassandraFragmentStorage";
import CassandraStateStorage from "./persistence/state/CassandraStateStorage";
import CassandraEventStreamStorage from "./persistence/streams/CassandraEventStreamStorage";

const distance = cassandra.types.distance;
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

class Singleton {
    public static cassandraClient;

    public static getCassandraClient() {
        if (!Singleton.cassandraClient) {
            Singleton.cassandraClient = new cassandra.Client({
                contactPoints: ["172.17.0.2:9042"],
                localDataCenter: "datacenter1",
                pooling: {
                    maxRequestsPerConnection: 4000,
                    coreConnectionsPerHost: {
                        [distance.local]: 2,
                        [distance.remote]: 1,
                    },
                },
                policies: {
                    retry: new cassandra.policies.retry.RetryPolicy(),
                },
            });
        }

        return Singleton.cassandraClient;
    }
}

export const DATA_ROOT = "https://fast-and-slow.osoc.be/data";
export const ADMIN_ROOT = "https://fast-and-slow.osoc.be/streams";

export const LOGGER = logger;
export const STREAM_STORAGE = new CassandraEventStreamStorage(Singleton.getCassandraClient());
export const FRAGMENTATION_STORAGE = new CassandraFragmentationStorage(Singleton.getCassandraClient());
export const FRAGMENT_STORAGE = new CassandraFragmentStorage(Singleton.getCassandraClient());
export const EVENT_STORAGE = new CassandraEventStorage(Singleton.getCassandraClient());
export const STATE_STORAGE = new CassandraStateStorage(Singleton.getCassandraClient());

import cassandra = require("cassandra-driver");
import EventStream from "../../entities/EventStream";
import StateStorage from "../state/StateStorage";
import EventStreamStorage from "./EventStreamStorage";

export default class CassandraEventStreamStorage extends EventStreamStorage {
    protected client: cassandra.Client;

    constructor(client: cassandra.Client) {
        super();
        this.client = client;
    }

    public async* getAll(): AsyncGenerator<EventStream> {
        const base = "SELECT * FROM proto.streams;";
        const results = await this.client.execute(base);

        for (const r of results.rows) {
            yield new EventStream(r.streamid, r.name, r.timeproperty, JSON.parse(r.properties), r.status);
        }
    }

    public async getByID(uri: string): Promise<EventStream | undefined> {
        const base = "SELECT * FROM proto.streams where streamID = ? LIMIT 1";
        const results = await this.client.execute(base, [uri], { prepare: true });

        for (const r of results.rows) {
            return new EventStream(r.streamid, r.name, r.timeproperty, JSON.parse(r.properties), r.status);
        }
    }

    public async getByName(name: string): Promise<EventStream | undefined> {
        const base = "SELECT * FROM proto.streams_by_name where name = ? LIMIT 1";
        const results = await this.client.execute(base, [name], { prepare: true });

        for (const r of results.rows) {
            return new EventStream(r.streamid, r.name, r.timeproperty, JSON.parse(r.properties), r.status);
        }
    }

    public async add(stream: EventStream): Promise<void> {
        const q1 = "INSERT INTO proto.streams (streamID, name, timeProperty, properties, status) VALUES (?, ?, ?, ?, ?)";
        const q2 = "INSERT INTO proto.streams_by_name (streamID, name, timeProperty, properties, status) VALUES (?, ?, ?, ?, ?)";
        const p1 = this.client.execute(
            q1,
            [stream.sourceURI, stream.name, stream.timeProperty, JSON.stringify(stream.properties), stream.status],
            { prepare: true },
        );
        const p2 = this.client.execute(
            q2,
            [stream.sourceURI, stream.name, stream.timeProperty, JSON.stringify(stream.properties), stream.status],
            { prepare: true },
        );
        await Promise.all([p1, p2]);
        return Promise.resolve();
    }
}

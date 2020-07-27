import cassandra = require("cassandra-driver");
import EventStream from "../../entities/EventStream";
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
            const es = new EventStream(r.streamid, r.name, r.timeproperty, JSON.parse(r.properties), r.status);
            if (r.progress) {
                es.progress = JSON.parse(r.progress);
            }
            yield es;
        }
    }

    public async getByID(uri: string): Promise<EventStream | undefined> {
        const base = "SELECT * FROM proto.streams where streamID = ? LIMIT 1";
        const results = await this.client.execute(base, [uri], { prepare: true });

        for (const r of results.rows) {
            const es = new EventStream(r.streamid, r.name, r.timeproperty, JSON.parse(r.properties), r.status);
            if (r.progress) {
                es.progress = JSON.parse(r.progress);
            }
            return es;
        }
    }

    public async getByName(name: string): Promise<EventStream | undefined> {
        const base = "SELECT * FROM proto.streams_by_name where name = ? LIMIT 1";
        const results = await this.client.execute(base, [name], { prepare: true });

        for (const r of results.rows) {
            const es = new EventStream(r.streamid, r.name, r.timeproperty, JSON.parse(r.properties), r.status);
            if (r.progress) {
                es.progress = JSON.parse(r.progress);
            }
            return es;
        }
    }

    public async add(stream: EventStream): Promise<void> {
        const q1 = "INSERT INTO proto.streams (streamID, name, timeProperty, properties, status, progress) VALUES (?, ?, ?, ?, ?, ?)";
        const q2 = "INSERT INTO proto.streams_by_name (streamID, name, timeProperty, properties, status, progress) VALUES (?, ?, ?, ?, ?, ?)";
        const params = [
            stream.sourceURI,
            stream.name,
            stream.timeProperty,
            JSON.stringify(stream.properties),
            stream.status,
            JSON.stringify(stream.progress),
        ];

        const p1 = this.client.execute(q1, params, { prepare: true });
        const p2 = this.client.execute(q2, params, { prepare: true });
        await Promise.all([p1, p2]);
        return Promise.resolve();
    }
}

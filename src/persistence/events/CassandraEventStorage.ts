import fromEmitter from "@async-generators/from-emitter";
import cassandra = require("cassandra-driver");
import * as RdfString from "rdf-string";

import RDFEvent from "../../entities/Event";
import { URI } from "../../util/constants";
import EventStorage from "./EventStorage";

export default class CassandraEventStorage extends EventStorage {
    protected client: cassandra.Client;

    constructor(client: cassandra.Client) {
        super();
        this.client = client;
    }

    public async* getAllByStream(streamID: string): AsyncGenerator<RDFEvent> {
        const base = "SELECT * FROM proto.events_by_stream WHERE streamID = ?;";
        const emitter = this.client.stream(base, [streamID], { prepare: true });
        const baseGenerator = fromEmitter(emitter, { onNext: "data" });

        for await (const r of baseGenerator) {
            yield new RDFEvent(
                (r as any).eventid,
                (r as any).eventdata.map((q) => RdfString.stringQuadToQuad(q)),
                (r as any).eventtime,
            );
        }
    }

    public async* getAllByFragment(
        streamID: string,
        fragmentName: string,
        bucketValue: string,
    ): AsyncGenerator<RDFEvent> {
        const base = `SELECT * FROM proto.events_by_bucket
                      WHERE streamID = ? and fragmentName = ? and bucketValue = ?;
                      `;
        const emitter = this.client.stream(base, [streamID, fragmentName, bucketValue], { prepare: true });
        const baseGenerator = fromEmitter(emitter, { onNext: "data" });

        for await (const r of baseGenerator) {
            yield new RDFEvent(
                (r as any).eventid,
                (r as any).eventdata.map((q) => RdfString.stringQuadToQuad(q)),
                (r as any).eventtime,
            );
        }
    }

    public async getByID(identifier: string): Promise<RDFEvent | undefined> {
        const base = "SELECT * FROM proto.events_by_stream WHERE eventID = ? LIMIT 1;";
        const results = await this.client.execute(base, [identifier], { prepare: true });

        for (const r of results.rows) {
            return new RDFEvent(
                r.eventid,
                r.eventdata.map((q) => RdfString.stringQuadToQuad(q)),
                r.eventtime,
            );
        }
    }

    public async add(streamID: URI, event: RDFEvent): Promise<void> {
        const base = `INSERT INTO proto.events_by_stream (streamID, eventId, eventData, eventTime)
                      VALUES (?, ?, ?, ?, ?)`;
        const params = [
            streamID,
            event.id,
            event.data.map((q) => RdfString.quadToStringQuad(q)),
            event.timestamp,
        ];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }

    public async addToBucket(
        streamID: URI,
        fragmentName: string,
        bucketValue: string,
        event: RDFEvent,
    ): Promise<void> {
        const base = `INSERT INTO proto.events_by_bucket (streamID, fragmentName, bucketValue, eventId, eventData, eventTime)
                      VALUES (?, ?, ?, ?, ?)`;
        const params = [
            streamID,
            fragmentName,
            bucketValue,
            event.id,
            event.data.map((q) => RdfString.quadToStringQuad(q)),
            event.timestamp,
        ];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }
}

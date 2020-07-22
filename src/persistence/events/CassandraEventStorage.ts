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

    public async* getAllByStream(streamID: string, sinceDate?: string): AsyncGenerator<RDFEvent> {
        let emitter;
        if (!sinceDate) {
            const base = "SELECT * FROM proto.events_by_stream WHERE streamID = ?;";
            emitter = this.client.stream(base, [streamID], { prepare: true });
        } else {
            const base = `SELECT * FROM proto.events_by_stream WHERE streamID = ? and eventTime >= ?;
                        `;
            emitter = this.client.stream(
                base,
                [streamID, sinceDate],
                { prepare: true },
            );
        }

        const baseGenerator = fromEmitter(emitter, { onNext: "data", onDone: "end" });

        for await (const r of baseGenerator) {
            yield new RDFEvent(
                (r as any).eventid,
                JSON.parse((r as any).eventdata).map((q) => RdfString.stringQuadToQuad(q)),
                (r as any).eventtime,
            );
        }
    }

    public async* getLimitedByStream(
        streamID: string,
        limit = 1000,
        sinceDate?: string,
    ): AsyncGenerator<RDFEvent> {
        let emitter;
        if (!sinceDate) {
            const base = "SELECT * FROM proto.events_by_stream WHERE streamID = ? LIMIT ?;";
            emitter = this.client.stream(base, [streamID, limit], { prepare: true });
        } else {
            const base = `SELECT * FROM proto.events_by_stream WHERE streamID = ? and eventTime >= ? LIMIT ?;
                        `;
            emitter = this.client.stream(
                base,
                [streamID, sinceDate, limit],
                { prepare: true },
            );
        }

        const baseGenerator = fromEmitter(emitter, { onNext: "data", onDone: "end" });

        for await (const r of baseGenerator) {
            yield new RDFEvent(
                (r as any).eventid,
                JSON.parse((r as any).eventdata).map((q) => RdfString.stringQuadToQuad(q)),
                (r as any).eventtime,
            );
        }
    }

    public async* getAllByFragment(
        streamID: string,
        fragmentName: string,
        bucketValue: string,
        sinceDate?: string,
    ): AsyncGenerator<RDFEvent> {
        let emitter;
        if (!sinceDate) {
            const base = `SELECT * FROM proto.events_by_bucket
                          WHERE streamID = ? and fragmentName = ? and bucketValue = ?;
                        `;
            emitter = this.client.stream(base, [streamID, fragmentName, bucketValue], { prepare: true });
        } else {
            const base = `SELECT * FROM proto.events_by_bucket
                          WHERE streamID = ? and fragmentName = ? and bucketValue = ? and eventTime >= ?;
                        `;
            emitter = this.client.stream(
                base,
                [streamID, fragmentName, bucketValue, sinceDate],
                { prepare: true },
            );
        }
        const baseGenerator = fromEmitter(emitter, { onNext: "data", onDone: "end" });

        for await (const r of baseGenerator) {
            yield new RDFEvent(
                (r as any).eventid,
                JSON.parse((r as any).eventdata).map((q) => RdfString.stringQuadToQuad(q)),
                (r as any).eventtime,
            );
        }
    }

    public async* getLimitedByFragment(
        streamID: string,
        fragmentName: string,
        bucketValue: string,
        limit = 1000,
        sinceDate?: string,
    ): AsyncGenerator<RDFEvent> {
        let emitter;
        if (!sinceDate) {
            const base = `SELECT * FROM proto.events_by_bucket
                          WHERE streamID = ? and fragmentName = ? and bucketValue = ? LIMIT ?;
                        `;
            emitter = this.client.stream(base, [streamID, fragmentName, bucketValue, limit], { prepare: true });
        } else {
            const base = `SELECT * FROM proto.events_by_bucket
                          WHERE streamID = ? and fragmentName = ? and bucketValue = ? and eventTime >= ? LIMIT ?;
                        `;
            emitter = this.client.stream(
                base,
                [streamID, fragmentName, bucketValue, sinceDate, limit],
                { prepare: true },
            );
        }

        const baseGenerator = fromEmitter(emitter, { onNext: "data", onDone: "end" });

        for await (const r of baseGenerator) {
            yield new RDFEvent(
                (r as any).eventid,
                JSON.parse((r as any).eventdata).map((q) => RdfString.stringQuadToQuad(q)),
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
                JSON.parse(r.eventdata).map((q) => RdfString.stringQuadToQuad(q)),
                r.eventtime,
            );
        }
    }

    public async add(streamID: URI, event: RDFEvent): Promise<void> {
        const base = `INSERT INTO proto.events_by_stream (streamID, eventId, eventData, eventTime)
                      VALUES (?, ?, ?, ?)`;
        const params = [
            streamID,
            event.id,
            JSON.stringify(event.data.map((q) => RdfString.quadToStringQuad(q))),
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
                      VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [
            streamID,
            fragmentName,
            bucketValue,
            event.id,
            JSON.stringify(event.data.map((q) => RdfString.quadToStringQuad(q))),
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

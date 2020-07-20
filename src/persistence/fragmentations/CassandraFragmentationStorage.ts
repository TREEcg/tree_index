import cassandra = require("cassandra-driver");
import Fragmentation from "../../entities/Fragmentation";
import StateStorage from "../../state/StateStorage";
import { URI } from "../../util/constants";
import FragmentationStorage from "./FragmentationStorage";

export default class CassandraFragmentationStorage extends FragmentationStorage {
    protected client: cassandra.Client;

    constructor(stateStorage: StateStorage, client: cassandra.Client) {
        super(stateStorage);
        this.client = client;
    }

    public async* getAllByStream(streamID: URI): AsyncGenerator<Fragmentation> {
        const base = "SELECT * FROM proto.fragmentations_by_stream WHERE streamID = ?;";
        const results = await this.client.execute(base, [streamID], { prepare: true });

        for (const r of results.rows) {
            yield new Fragmentation(
                r.streamid,
                r.name,
                r.shaclpath,
                r.kind,
                JSON.parse(r.params),
                r.status,
            );
        }
    }

    public async getByName(streamID: URI, name: string): Promise<Fragmentation | undefined> {
        const base = "SELECT * FROM proto.fragmentations_by_stream WHERE streamID = ? AND name = ? LIMIT 1";
        const results = await this.client.execute(base, [streamID, name], { prepare: true });

        for (const r of results.rows) {
            return new Fragmentation(
                r.streamid,
                r.name,
                r.shaclpath,
                r.kind,
                JSON.parse(r.params),
                r.status,
            );
        }
    }

    public async add(fragmentation: Fragmentation): Promise<void> {
        const base = `INSERT INTO proto.fragmentations_by_stream (streamID, name, shaclPath, kind, params, status)
                      VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [
            fragmentation.streamID,
            fragmentation.name,
            fragmentation.shaclPath,
            fragmentation.kind,
            JSON.stringify(fragmentation.params),
            fragmentation.status,
        ];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }
}

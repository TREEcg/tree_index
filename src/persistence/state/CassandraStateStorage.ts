import cassandra = require("cassandra-driver");
import StateStorage from "./StateStorage";

export default class CassandraStageStorage extends StateStorage {
    protected client: cassandra.Client;

    constructor(client) {
        super();
        this.client = client;
    }

    public async get(key: string): Promise<string | undefined> {
        const base = "SELECT * FROM proto.state WHERE key = ? LIMIT 1";
        const results = await this.client.execute(base, [key], { prepare: true });

        for (const r of results.rows) {
            return r.value;
        }
        Promise.resolve();
    }

    public async set(key: string, value: string): Promise<void> {
        const base = `INSERT INTO proto.state (key, value)
                      VALUES (?, ?)`;
        const params = [
            key, value,
        ];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }
}

import fromEmitter from "@async-generators/from-emitter";
import cassandra = require("cassandra-driver");

import Fragment from "../../entities/Fragment";
import BucketStorage from "./FragmentStorage";

export default class CassandraFragmentStorage extends BucketStorage {
    protected client: cassandra.Client;

    constructor(client: cassandra.Client) {
        super();
        this.client = client;
    }

    public async* getAllByFragmentation(streamID: string, fragmentName: string): AsyncGenerator<Fragment> {
        const base = "SELECT * FROM proto.buckets_by_fragmentation WHERE streamID = ? AND fragmentName = ?;";
        const emitter = this.client.stream(base, [streamID, fragmentName], { prepare: true });
        const baseGenerator = fromEmitter(emitter, { onNext: "data" });

        for await (const r of baseGenerator) {
            yield new Fragment(
                (r as any).streamid,
                (r as any).fragmentname,
                (r as any).value,
            );
        }
    }

    public async add(fragment: Fragment): Promise<void> {
        const base = `UPDATE proto.buckets_by_fragmentation
                      SET count = count + 1
                      WHERE streamID = ? and fragmentName = ? and value = ?;
                     `;
        const params = [fragment.streamID, fragment.fragmentName, fragment.value];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }
}

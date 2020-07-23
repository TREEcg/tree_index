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

    public async* getRootsByFragmentation(streamID: string, fragmentName: string): AsyncGenerator<Fragment> {
        const base = "SELECT * FROM proto.roots_by_fragmentation WHERE streamID = ? AND fragmentName = ?;";
        const emitter = this.client.stream(base, [streamID, fragmentName], { prepare: true });
        const baseGenerator = fromEmitter(emitter, { onNext: "data", onDone: "end" });

        for await (const r of baseGenerator) {
            yield new Fragment(
                (r as any).streamid,
                (r as any).fragmentname,
                (r as any).bucket,
                (r as any).datatype,
                (r as any).count,
            );
        }
    }

    public async* getRelationsByFragment(
        streamID: string,
        fragmentationName: string,
        bucketValue: string,
    ): AsyncGenerator<Fragment> {
        const base = "SELECT * FROM proto.relations_by_fragmentation WHERE streamID = ? AND fragmentName = ? and bucket = ?;";
        const params = [streamID, fragmentationName, bucketValue];
        const emitter = this.client.stream(base, params, { prepare: true });
        const baseGenerator = fromEmitter(emitter, { onNext: "data", onDone: "end" });

        for await (const r of baseGenerator) {
            yield new Fragment(
                (r as any).streamid,
                (r as any).fragmentname,
                (r as any).nextbucket,
                (r as any).datatype,
                (r as any).count,
            );
        }
    }

    public async addRoot(fragment: Fragment): Promise<void> {
        const base = `UPDATE proto.roots_by_fragmentation
                      SET count = count + 1
                      WHERE streamID = ? and fragmentName = ? and bucket = ? and datatype = ?;
                     `;
        const params = [fragment.streamID, fragment.fragmentName, fragment.value.toLowerCase(), fragment.dataType];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }

    public async addRelation(fragment: Fragment, relatedBucket: Fragment): Promise<void> {
        const base = `UPDATE proto.relations_by_fragmentation
                      SET count = count + 1
                      WHERE streamID = ? and fragmentName = ? and bucket = ? and nextBucket = ? and datatype = ? ;
                     `;
        const params = [
            fragment.streamID,
            fragment.fragmentName,
            fragment.value.toLowerCase(),
            relatedBucket.value.toLowerCase(),
            fragment.dataType,
        ];
        await this.client.execute(
            base,
            params,
            { prepare: true },
        );
        return Promise.resolve();
    }
}

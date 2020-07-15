import cassandra = require("cassandra-driver");
import RDFEvent from "../../entities/Event";
import BucketStorage from "./FragmentStorage";

export default class CassandraBucketStorage extends BucketStorage {
    protected client: cassandra.Client;

    constructor(prefix: string) {
        super(prefix);

        this.client = new cassandra.Client({
            contactPoints: ["172.17.0.2:9042"],
            localDataCenter: "datacenter1",
        });
    }

    /*
    protected async addToBuckets(buckets: Fragment[], object: RDFObject) {
        const base = 'INSERT INTO buckets.events (event_id, buckets, data) VALUES (?, ?, ?)';
        this.client.execute(base,
            [object.id, buckets.map((b) => b.value), JSON.stringify(object)],
            { prepare: true },
        );
    }
    */

    protected async getAllByFragmentID(fragmentID: string): Promise<RDFEvent[]> {
        throw new Error("Method not implemented.");
    }

    protected async addEvent(fragmentID: string, event: Event): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

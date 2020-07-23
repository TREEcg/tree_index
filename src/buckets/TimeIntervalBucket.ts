import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class TimeIntervalBucketStrategy extends BucketStrategy {
    protected interval: number;

    constructor(fragmentation: Fragmentation, interval: number) {
        super(fragmentation);
        this.interval = interval;
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            const date = new Date(value);
            const bucketTimestamp = date.getTime() - (date.getTime() % this.interval);
            result.push(this.getBucket(bucketTimestamp.toString(), type));
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#GreaterOrEqualThanRelation";
    }

    public filterIndexFragments(input: AsyncGenerator<Bucket>): Promise<Bucket[]> {
        // this fragmentation falls apart here -- better to use skip list pagination
        throw new Error("Method not implemented.");
    }

    protected getBucket(value: string, type: string): Bucket {
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value, type);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

import Bucket from "../entities/Fragment";
import FragmentKind from "../entities/FragmentKind";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class TimeIntervalBucketStrategy extends BucketStrategy {
    protected interval: number;

    constructor(streamID: URI, fragmentName: string, shaclPath: URI[], interval: number) {
        super(streamID, fragmentName, shaclPath);
        this.interval = interval;
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const value = this.selectValue(object);

        if (value) {
            const date = new Date(value);
            const bucketTimestamp = date.getTime() - (date.getTime() % this.interval);
            result.push(this.getBucket(bucketTimestamp.toString()));
        }

        return result;
    }

    protected getBucket(value: string): Bucket {
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";
import FragmentStorage from "../persistence/fragments/FragmentStorage";
import Fragment from "../entities/Fragment";
import FragmentChain from "../entities/FragmentChain";

export default class TimeIntervalBucketStrategy extends BucketStrategy {
    protected interval: number;

    constructor(fragmentation: Fragmentation, interval: number) {
        super(fragmentation);
        this.interval = interval;
    }

    public labelObject(object: RDFObject): FragmentChain[] {
        const result: FragmentChain[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            const date = new Date(value);
            const bucketTimestamp = date.getTime() - (date.getTime() % this.interval);
            const frag = this.getBucket(bucketTimestamp.toString(), type);
            result.push(new FragmentChain(frag, []));
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#GreaterOrEqualThanRelation";
    }

    protected getBucket(value: string, type: string): Bucket {
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value, type);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

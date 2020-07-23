import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import BucketStrategy from "./BucketStrategy";

export default class SuffixBucketStrategy extends BucketStrategy {
    constructor(fragmentation: Fragmentation) {
        super(fragmentation);
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const values = this.selectValues(object);
        for (const value of values) {
            for (let i = 0; i < value.length; i++) {
                const suffix = value.substring(i);
                result.push(this.getBucket(suffix));
            }
        }

        return result;
    }

    protected getBucket(value: string): Bucket {
        value = value.toLowerCase();
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

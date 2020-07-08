import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import Bucket from "./Bucket";
import { BucketKind } from "./BucketKind";
import BucketStrategy from "./BucketStrategy";

export default class SuffixBucketStrategy extends BucketStrategy {
    // protected maxLength: number | undefined;

    constructor(shaclPath: URI[], maxLength?: number) {
        super(shaclPath);
        // this.maxLength = maxLength;
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const value = this.selectValue(object);

        if (value) {
            for (let i = 0; i < value.length; i++) {
                const suffix = value.substring(i);
                result.push(this.getBucket(suffix));
            }
        }

        return result;
    }

    protected getBucket(value: string): Bucket {
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(BucketKind.SUFFIX, this.shaclPath, value);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

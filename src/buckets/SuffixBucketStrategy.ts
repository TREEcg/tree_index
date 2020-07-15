import Bucket from "../entities/Fragment";
import FragmentKind from "../entities/FragmentKind";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
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
            const bucket = new Bucket(FragmentKind.SUFFIX, `suffix_${this.shaclPath}_${value}`, value);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

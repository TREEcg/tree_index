import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import BucketStrategy from "./BucketStrategy";

export default class NGramBucketStrategy extends BucketStrategy {
    protected minLength: number;
    protected maxLength: number;

    constructor(fragmentation: Fragmentation, minLength: number, maxLength: number) {
        super(fragmentation);
        this.minLength = minLength;
        this.maxLength = maxLength;
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const values = this.selectValues(object);
        for (const value of values) {
            for (let length = this.minLength; length <= this.maxLength; length++) {
                for (let i = 0; i <= value.length - length; i++) {
                    const ngram = value.substr(i, length);
                    result.push(this.getBucket(ngram));
                }
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

import Bucket from "../entities/Fragment";
import FragmentKind from "../entities/FragmentKind";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class NGramBucketStrategy extends BucketStrategy {
    protected minLength: number;
    protected maxLength: number;

    constructor(streamID: URI, fragmentName: string, shaclPath: URI[], minLength: number, maxLength: number) {
        super(streamID, fragmentName, shaclPath);
        this.minLength = minLength;
        this.maxLength = maxLength;
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const value = this.selectValue(object);

        if (value) {
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
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

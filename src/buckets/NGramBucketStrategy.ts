import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import Bucket from "./Bucket";
import { BucketKind } from "./BucketKind";
import BucketStrategy from "./BucketStrategy";

export default class NGramBucketStrategy extends BucketStrategy {
    protected minLength: number;
    protected maxLength: number;

    constructor(shaclPath: URI[], minLength: number, maxLength: number) {
        super(shaclPath);
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
            const bucket = new Bucket(BucketKind.NGRAM, this.shaclPath, `ngram_${this.shaclPath}_${value}`);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

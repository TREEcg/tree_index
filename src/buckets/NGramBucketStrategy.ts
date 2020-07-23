import Fragment from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import FragmentChain from "../entities/FragmentChain";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class NGramBucketStrategy extends BucketStrategy {
    protected minLength: number;
    protected maxLength: number;

    constructor(fragmentation: Fragmentation, minLength: number, maxLength: number) {
        super(fragmentation);
        this.minLength = minLength;
        this.maxLength = maxLength;
    }

    public labelObject(object: RDFObject): FragmentChain[] {
        const result: FragmentChain[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            for (let begin = 0; begin <= value.length - this.minLength; begin++) {
                result.push(...this.help(type, value, begin, this.minLength));
            }
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#SubstringRelation";
    }

    protected getBucket(value: string, type: string): Fragment {
        value = value.toLowerCase();
        if (!this.buckets.has(value)) {
            const bucket = new Fragment(this.streamID, this.fragmentName, value, type);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Fragment;
    }

    private help(dataType: string, value: string, position: number, length: number): FragmentChain[] {
        if (length > this.maxLength || length + position > value.length) {
            return [];
        }
        const children = this.help(dataType, value, position, length + 1);
        const ngram = value.substr(position, length);
        const fragment = this.getBucket(ngram, dataType);
        return [new FragmentChain(fragment, children)];
    }
}

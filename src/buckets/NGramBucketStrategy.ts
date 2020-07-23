import Fragment from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
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

    public labelObject(object: RDFObject): Fragment[] {
        const result: Fragment[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            for (let length = this.minLength; length <= this.maxLength; length++) {
                for (let i = 0; i <= value.length - length; i++) {
                    const ngram = value.substr(i, length);
                    result.push(this.getBucket(ngram, type));
                }
            }
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#SubstringRelation";
    }

    public async filterIndexFragments(input: AsyncGenerator<Fragment>): Promise<Fragment[]> {
        const useful: Fragment[] = [];
        for await (const frag of input) {
            if (frag.value.length <= 2) {
                useful.push(frag);
            }
        }
        return useful;
    }

    protected getBucket(value: string, type: string): Fragment {
        value = value.toLowerCase();
        if (!this.buckets.has(value)) {
            const bucket = new Fragment(this.streamID, this.fragmentName, value, type);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Fragment;
    }
}

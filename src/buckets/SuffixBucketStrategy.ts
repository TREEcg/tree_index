import Fragment from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class SuffixBucketStrategy extends BucketStrategy {
    constructor(fragmentation: Fragmentation) {
        super(fragmentation);
    }

    public labelObject(object: RDFObject): Fragment[] {
        const result: Fragment[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            for (let i = 0; i < value.length; i++) {
                const suffix = value.substring(i);
                result.push(this.getBucket(suffix, type));
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

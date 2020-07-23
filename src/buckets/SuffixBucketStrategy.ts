import Fragment from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import FragmentChain from "../entities/FragmentChain";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class SuffixBucketStrategy extends BucketStrategy {
    constructor(fragmentation: Fragmentation) {
        super(fragmentation);
    }

    public labelObject(object: RDFObject): FragmentChain[] {
        const result: FragmentChain[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            result.push(...this.help(type, value, value.length - 2));
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

    private help(dataType: string, value: string, begin: number): FragmentChain[] {
        if (begin < 0) {
            return [];
        }
        const children = this.help(dataType, value, begin - 1);
        const suffix = value.substring(begin);
        const fragment = this.getBucket(suffix, dataType);
        return [new FragmentChain(fragment, children)];
    }
}

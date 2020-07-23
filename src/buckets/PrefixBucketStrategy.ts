import Fragment from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import FragmentChain from "../entities/FragmentChain";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class PrefixBucketStrategy extends BucketStrategy {
    constructor(fragmentation: Fragmentation) {
        super(fragmentation);
    }

    public labelObject(object: RDFObject): FragmentChain[] {
        const result: FragmentChain[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            result.push(...this.help(type, value, 2));
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#PrefixRelation";
    }

    protected getBucket(value: string, type: string): Fragment {
        value = value.toLowerCase();
        if (!this.buckets.has(value)) {
            const bucket = new Fragment(this.streamID, this.fragmentName, value, type);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Fragment;
    }

    private help(dataType: string, value: string, end: number): FragmentChain[] {
        if (end > value.length) {
            return [];
        }
        const children = this.help(dataType, value, end + 1);
        const prefix = value.substr(0, end);
        const fragment = this.getBucket(prefix, dataType);
        return [new FragmentChain(fragment, children)];
    }
}

import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import FragmentChain from "../entities/FragmentChain";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class IdentityBucketStrategy extends BucketStrategy {
    constructor(fragmentation: Fragmentation) {
        super(fragmentation);
    }

    public labelObject(object: RDFObject): FragmentChain[] {
        const result: FragmentChain[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            const frag = this.getBucket(value, type);
            result.push(new FragmentChain(frag, []));
        }
        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#EqualThanRelation";
    }

    protected getBucket(value: string, dataType: string): Bucket {
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value, dataType);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

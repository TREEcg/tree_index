import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class IdentityBucketStrategy extends BucketStrategy {
    constructor(fragmentation: Fragmentation) {
        super(fragmentation);
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            result.push(this.getBucket(value, type));
        }
        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#EqualThanRelation";
    }

    public filterIndexFragments(input: AsyncGenerator<Bucket>): Promise<Bucket[]> {
        // do we want to return all of them?
        throw new Error("Method not implemented.");
    }

    protected getBucket(value: string, dataType: string): Bucket {
        if (!this.buckets.has(value)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, value, dataType);
            this.buckets.set(value, bucket);
        }

        return this.buckets.get(value) as Bucket;
    }
}

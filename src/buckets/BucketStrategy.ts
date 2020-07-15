import Bucket from "../entities/Fragment";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";

export default abstract class BucketStrategy {
    protected streamID: URI;
    protected fragmentName: string;
    protected shaclPath: string[];
    protected buckets: Map<string, Bucket>;

    constructor(streamID: URI, fragmentName: string, shaclPath: string[]) {
        this.shaclPath = shaclPath;
        this.buckets = new Map();
        this.streamID = streamID;
        this.fragmentName = fragmentName;
    }

    public abstract labelObject(object: RDFObject): Bucket[];

    protected selectValue(object: RDFObject): string | undefined {
        // naive approach for now
        // assumes the final property is enough to find the correct value
        const property = this.shaclPath[this.shaclPath.length - 1];
        const matches = object.data.filter((q) => q.predicate.value === property);
        if (matches.length) {
            return matches[0].object.value;
        }
    }
}

import RDFObject from "../entities/RDFObject";
import Bucket from "./Bucket";

export default abstract class BucketStrategy {
    protected shaclPath: string[];
    protected buckets: Map<string, Bucket>;

    constructor(shaclPath: string[]) {
        this.shaclPath = shaclPath;
        this.buckets = new Map();
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

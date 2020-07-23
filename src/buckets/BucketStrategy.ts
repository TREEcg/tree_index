import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import FragmentChain from "../entities/FragmentChain";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";

export default abstract class BucketStrategy {
    public readonly streamID: URI;
    public readonly fragmentName: string;
    protected shaclPath: string[];
    protected buckets: Map<string, Bucket>;
    private dataType: string | undefined;

    constructor(fragmentation: Fragmentation) {
        this.shaclPath = fragmentation.shaclPath;
        this.buckets = new Map();
        this.streamID = fragmentation.streamID;
        this.fragmentName = fragmentation.name;
    }

    public abstract labelObject(object: RDFObject): FragmentChain[];
    public abstract getRelationType(): URI;

    protected selectValues(object: RDFObject): string[] {
        // naive approach for now
        // assumes the final property is enough to find the correct value
        const property = this.shaclPath[this.shaclPath.length - 1];
        const matches = object.data.filter((q) => q.predicate.value === property);
        return matches.map((m) => m.object.value);
    }

    protected selectDataType(object: RDFObject): string {
        // naive approach for now
        // assumes the final property is enough to find the correct value
        if (this.dataType) {
            return this.dataType;
        }
        const property = this.shaclPath[this.shaclPath.length - 1];
        const matches = object.data.filter((q) => q.predicate.value === property);
        for (const quad of matches) {
            if (quad.object.termType === "Literal") {
                this.dataType = quad.object.datatype.value;
                return this.dataType;
            }
        }
        this.dataType = "http://www.w3.org/2001/XMLSchema#string";
        return this.dataType;
    }
}

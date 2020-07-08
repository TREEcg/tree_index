import { URI } from "../util/constants";
import { BucketKind } from "./BucketKind";

export default class Bucket {
    public shaclPath: URI[];
    public value: any;
    public kind: BucketKind;

    constructor(kind: BucketKind, shaclPath: URI[], value: any) {
        this.kind = kind;
        this.shaclPath = shaclPath;
        this.value = value;
    }
}

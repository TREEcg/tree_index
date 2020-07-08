import RDFObject from "../entities/RDFObject";
import Bucket from "./Bucket";
import BucketStrategy from "./BucketStrategy";

export default abstract class BucketStorage {
    protected bucketStrategies: BucketStrategy[];
    protected prefix: string;

    constructor(prefix: string, bucketStrategies: BucketStrategy[]) {
        this.prefix = prefix;
        this.bucketStrategies = bucketStrategies;
    }

    public addObject(object: RDFObject) {
        for (const strategy of this.bucketStrategies) {
            for (const bucket of strategy.labelObject(object)) {
                this.addToBucket(bucket, object);
            }
        }
    }

    protected abstract addToBucket(bucket: Bucket, object: RDFObject);
}

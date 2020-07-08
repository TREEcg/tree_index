import RDFObject from "../entities/RDFObject";
import Bucket from "./Bucket";
import BucketStorage from "./BucketStorage";
import BucketStrategy from "./BucketStrategy";

export default class DummyBucketStorage extends BucketStorage {
    constructor(prefix: string, bucketStrategies: BucketStrategy[]) {
        super(prefix, bucketStrategies);
    }

    protected addToBucket(bucket: Bucket, object: RDFObject) {
        //
    }
}

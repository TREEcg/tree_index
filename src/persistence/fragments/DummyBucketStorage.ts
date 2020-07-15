import RDFEvent from "../../entities/Event";
import BucketStorage from "./FragmentStorage";

export default class DummyBucketStorage extends BucketStorage {
    constructor(prefix: string) {
        super(prefix);
    }

    protected async getAllByFragmentID(fragmentID: string): Promise<RDFEvent[]> {
        throw new Error("Method not implemented.");
    }

    protected async addEvent(fragmentID: string, event: Event): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

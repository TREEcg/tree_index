import Fragment from "../../entities/Fragment";
import BucketStorage from "./FragmentStorage";

export default class DummyFragmentStorage extends BucketStorage {
    public getAllByFragmentation(streamID: string, fragmentName: string): AsyncGenerator<import("../../entities/Fragment").default, any, unknown> {
        throw new Error("Method not implemented.");
    }
    public add(fragment: Fragment): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

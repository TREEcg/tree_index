import Fragment from "../../entities/Fragment";
import { URI } from "../../util/constants";

export default abstract class FragmentStorage {
    public abstract getRootsByFragmentation(streamID: URI, fragmentName: string): AsyncGenerator<Fragment>;
    public abstract addRoot(fragment: Fragment): Promise<void>;
    public abstract getRelationsByFragment(
        streamID: string,
        fragmentationName: string,
        bucketValue: string,
    ): AsyncGenerator<Fragment>;
    public abstract async addRelation(fragment: Fragment, relatedBucket: Fragment): Promise<void>;
}

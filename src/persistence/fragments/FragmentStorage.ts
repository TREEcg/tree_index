import Fragment from "../../entities/Fragment";
import { URI } from "../../util/constants";

export default abstract class Storage {
    public abstract getAllByFragmentation(streamID: URI, fragmentName: string): AsyncGenerator<Fragment>;
    public abstract async add(fragment: Fragment): Promise<void>;
}

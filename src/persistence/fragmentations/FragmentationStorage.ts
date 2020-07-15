import Fragmentation from "../../entities/Fragmentation";
import StateStorage from "../../state/StateStorage";
import { URI } from "../../util/constants";

export default abstract class FragmentationStorage {
    protected stateStorage: StateStorage;

    constructor(stateStorage: StateStorage) {
        this.stateStorage = stateStorage;
    }

    public abstract getAllByStream(streamID: URI): AsyncGenerator<Fragmentation>;
    public abstract async getByName(streamID: URI, name: string): Promise<Fragmentation | undefined>;
    public abstract async add(fragmentation: Fragmentation): Promise<void>;
}

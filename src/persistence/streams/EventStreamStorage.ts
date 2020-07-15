import EventStream from "../../entities/EventStream";
import StateStorage from "../../state/StateStorage";
import { URI } from "../../util/constants";

export default abstract class EventStreamStorage {
    protected stateStorage: StateStorage;

    constructor(stateStorage: StateStorage) {
        this.stateStorage = stateStorage;
    }

    public abstract getAll(): AsyncGenerator<EventStream>;
    public abstract async getByID(uri: URI): Promise<EventStream | undefined>;
    public abstract async getByName(name: string): Promise<EventStream | undefined>;
    public abstract async add(stream: EventStream): Promise<void>;
}

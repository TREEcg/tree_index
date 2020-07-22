import EventStream from "../../entities/EventStream";
import { URI } from "../../util/constants";

export default abstract class EventStreamStorage {
    public abstract getAll(): AsyncGenerator<EventStream>;
    public abstract async getByID(uri: URI): Promise<EventStream | undefined>;
    public abstract async getByName(name: string): Promise<EventStream | undefined>;
    public abstract async add(stream: EventStream): Promise<void>;
}

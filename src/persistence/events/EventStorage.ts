import { URI } from "../../util/constants";

export default abstract class EventStorage {
    protected abstract async getAllByStream(streamID: URI): Promise<Event[]>;
    protected abstract async getByID(identifier: string): Promise<Event>;
    protected abstract async add(streamID: URI, event: Event): Promise<void>;
}

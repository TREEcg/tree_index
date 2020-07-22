import RDFEvent from "../../entities/Event";
import { URI } from "../../util/constants";

export default abstract class EventStorage {
    public abstract getAllByStream(
        streamID: URI,
        sinceDate: string,
    ): AsyncGenerator<RDFEvent>;

    public abstract getLimitedByStream(
        streamID: URI,
        limit: number,
        sinceDate: string,
    ): AsyncGenerator<RDFEvent>;

    public abstract getAllByFragment(
        streamID: URI,
        fragmentName: string,
        bucketValue: string,
        sinceDate: string,
    ): AsyncGenerator<RDFEvent>;

    public abstract getLimitedByFragment(
        streamID: URI,
        fragmentName: string,
        bucketValue: string,
        limit: number,
        sinceDate: string,
    ): AsyncGenerator<RDFEvent>;

    public abstract async getByID(identifier: string): Promise<RDFEvent | undefined>;

    public abstract async add(streamID: URI, event: RDFEvent): Promise<void>;
    public abstract async addToBucket(
        streamID: URI,
        fragmentName: string,
        bucketValue: string,
        event: RDFEvent,
    ): Promise<void>;
}

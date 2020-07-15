import RDFEvent from "../../entities/Event";

export default abstract class Storage {
    protected prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    protected abstract async getAllByFragmentID(fragmentID: string): Promise<RDFEvent[]>;
    protected abstract async addEvent(fragmentID: string, event: Event): Promise<void>;
}

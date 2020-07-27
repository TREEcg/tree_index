import { URI } from "../util/constants";
import EntityStatus from "./EntityStatus";
import EventStreamProgress from "./EventStreamProgress";
import Fragmentation from "./Fragmentation";
import ShaclProperty from "./ShaclProperty";

export default class EventStream {
    public sourceURI: URI;
    public name: string;
    public timeProperty: URI[];
    public properties: ShaclProperty[];
    public status: EntityStatus;
    public fragmentations: Fragmentation[] | undefined;
    public progress: EventStreamProgress;

    constructor(
        source: URI,
        name: string,
        timeProperty: URI[],
        properties: ShaclProperty[],
        status: EntityStatus,
    ) {
        this.sourceURI = source;
        this.name = name;
        this.timeProperty = timeProperty;
        this.properties = properties;
        this.status = status;
        this.progress = {};
    }
}

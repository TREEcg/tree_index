import { URI } from "../util/constants";
import EntityStatus from "./EntityStatus";
import Fragmentation from "./Fragmentation";
import ShaclProperty from "./ShaclProperty";

export default class EventStream {
    public sourceURI: URI;
    public name: string;
    public properties: ShaclProperty[];
    public status: EntityStatus;
    public fragmentations: Fragmentation[] | undefined;

    constructor(
        source: URI,
        name: string,
        properties: ShaclProperty[],
        status: EntityStatus,
    ) {
        this.sourceURI = source;
        this.name = name;
        this.properties = properties;
        this.status = status;
    }
}

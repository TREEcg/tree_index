import { URI } from "../util/constants";
import EntityStatus from "./EntityStatus";
import FragmentKind from "./FragmentKind";

export default class Fragmentation {
    public streamID: URI;
    public name: string;
    public shaclPath: URI[];
    public propertyLabel: string;
    public kind: FragmentKind;
    public params: object;
    public status: EntityStatus;

    constructor(
        streamID: URI,
        name: string,
        shaclPath: URI[],
        propertyLabel: string,
        kind: FragmentKind,
        params: object,
        status: EntityStatus,
    ) {
        this.kind = kind;
        this.streamID = streamID;
        this.shaclPath = shaclPath;
        this.propertyLabel = propertyLabel;
        this.name = name;
        this.params = params;
        this.status = status;
    }
}

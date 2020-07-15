import { URI } from "../util/constants";
import FragmentKind from "./FragmentKind";

export default class Fragmentation {
    public streamID: URI;
    public name: string;
    public kind: FragmentKind;
    public status: string | undefined;

    public shaclPath: URI[];
    public params: object;

    constructor(
        streamID: URI,
        name: string,
        shaclPath: URI[],
        kind: FragmentKind,
        params: object,
    ) {
        this.kind = kind;
        this.streamID = streamID;
        this.shaclPath = shaclPath;
        this.name = name;
        this.params = params;
    }
}

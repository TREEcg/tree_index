import { URI } from "../util/constants";
import FragmentKind from "./FragmentKind";

export default class EventStream {
    public sourceURI: URI;
    public name: string;
    public description: string | undefined;
    public status: string | undefined;

    constructor(
        source: URI,
        name: string,
    ) {
        this.sourceURI = source;
        this.name = name;
    }
}

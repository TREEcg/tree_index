import { URI } from "../util/constants";
import FragmentKind from "./FragmentKind";

export default class Fragment {
    public streamID: URI;
    public fragmentName: string;
    public value: string;

    constructor(
        streamID: URI,
        fragmentName: string,
        value: string,
    ) {
        this.streamID = streamID;
        this.fragmentName = fragmentName;
        this.value = value;
    }
}

import { URI } from "../util/constants";
import FragmentKind from "./FragmentKind";

export default class Fragment {
    public streamID: URI;
    public fragmentName: string;
    public value: string;
    public dataType: URI;
    public count?: number;

    constructor(
        streamID: URI,
        fragmentName: string,
        value: string,
        dataType: URI,
        count?: number,
    ) {
        this.streamID = streamID;
        this.fragmentName = fragmentName;
        this.value = value;
        this.dataType = dataType;
        this.count = count;
    }
}

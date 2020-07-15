import { URI } from "../util/constants";
import FragmentKind from "./FragmentKind";

export default class Fragment {
    public identifier: string;
    public value: any;
    public kind: FragmentKind;

    constructor(
        kind: FragmentKind,
        identifier: string,
        value: any,
    ) {
        this.kind = kind;
        this.identifier = identifier;
        this.value = value;
    }
}

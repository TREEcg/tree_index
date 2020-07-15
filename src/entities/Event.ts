import { Quad } from "n3";
import { URI } from "../util/constants";
import RDFObject from "./RDFObject";

export default class RDFEvent extends RDFObject {
    protected timestamp: string;

    constructor(id: URI, data: Quad[], timestamp: string) {
        super(id, data);
        this.timestamp = timestamp;
    }
}

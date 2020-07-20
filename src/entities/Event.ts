import { Quad } from "rdf-js";
import { URI } from "../util/constants";
import RDFObject from "./RDFObject";

export default class RDFEvent extends RDFObject {
    public timestamp: string;

    constructor(id: URI, data: Quad[], timestamp: string) {
        super(id, data);
        this.timestamp = timestamp;
    }
}

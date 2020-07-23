import { Quad } from "rdf-js";
import { URI } from "../util/constants";
import RDFObject from "./RDFObject";

export default class RDFEvent extends RDFObject {
    public timestamp: Date;

    constructor(id: URI, data: Quad[], timestamp: Date) {
        super(id, data);
        this.timestamp = timestamp;
    }
}

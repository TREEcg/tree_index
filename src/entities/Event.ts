import { Quad } from "rdf-js";
import { URI } from "../util/constants";
import RDFObject from "./RDFObject";

export default class RDFEvent extends RDFObject {
    public timestamp: string;
    public level: number;

    constructor(id: URI, data: Quad[], timestamp: string, level: number) {
        super(id, data);
        this.timestamp = timestamp;
        this.level = level;
    }
}

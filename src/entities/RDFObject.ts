import { Quad } from "rdf-js";
import { URI } from "../util/constants";

export default class RDFObject {
    public id: URI;
    public data: Quad[];

    constructor(id: URI, data: Quad[]) {
        this.id = id;
        this.data = data;
    }
}

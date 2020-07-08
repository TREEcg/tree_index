import factory = require("@rdfjs/data-model");
import N3 = require("n3");

import { NamedNode, Quad } from "rdf-js";
import RDFObject from "../entities/RDFObject";
import StateStorage from "../state/StateStorage";
import { URI } from "../util/constants";
import Ingester from "./Ingester";

export default class EventStreamIngester extends Ingester {
    // bucket storage
    // triple storage

    protected stateStorage: StateStorage;
    protected frequency: number;

    constructor(stateStorage: StateStorage, frequency: number, source: URI) {
        super(source);
        this.stateStorage = stateStorage;
        this.frequency = frequency;

        if (!this.getCurrentPage()) {
            this.setCurrentPage(source);
        }

        this.tick();
        // setInterval(this.tick, this.frequency);
    }

    public processPage(data: Quad[]) {
        const store: N3.Store = new N3.Store();
        store.addQuads(data);

        // only process new data
        const previousData = this.getPreviousData();
        if (previousData) {
            // data only gets added so subtract known data
            store.removeQuads(previousData);
        }

        // these members are new
        const memberPred = factory.namedNode("https://w3id.org/tree#member");
        const members: NamedNode[] = store.getQuads(null, memberPred, null, null)
            .map((q: Quad) => q.object)
            .filter((o) => o.termType === "NamedNode") as NamedNode[];

        // process as self-contained objects
        const objects = members.map((m) => this.buildObject(m.value, store));
        objects.forEach((o) => this.processObject(o));

        // if next link, update this.currentPage

        // remember which quads were just processed
        this.setPreviousData(data);
    }

    public processObject(object: RDFObject) {
        // send to bucket storage
    }

    protected getCurrentPage(): string {
        return this.stateStorage.get("currentPage") || this.sourceURI;
    }

    protected setCurrentPage(page: URI) {
        return this.stateStorage.set("currentPage", page);
    }

    protected getPreviousData(): Quad[] | undefined {
        const data = this.stateStorage.get("previousData");
        if (data) {
            return JSON.parse(data);
        }
    }

    protected setPreviousData(data: Quad[]) {
        return this.stateStorage.set("previousData", JSON.stringify(data));
    }

    protected async tick() {
        const data = await this.fetchPage(this.getCurrentPage());
        return this.processPage(data);
    }
}

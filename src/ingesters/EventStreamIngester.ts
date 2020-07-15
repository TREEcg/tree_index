import factory = require("@rdfjs/data-model");
import N3 = require("n3");
import * as RdfString from "rdf-string";

import { NamedNode, Quad } from "rdf-js";
import BucketStorage from "../persistence/fragments/FragmentStorage";
import RDFObject from "../entities/RDFObject";
import StateStorage from "../state/StateStorage";
import { URI } from "../util/constants";
import Ingester from "./Ingester";

export default class EventStreamIngester extends Ingester {
    // bucket storage
    // triple storage

    protected stateStorage: StateStorage;
    protected bucketStorage: BucketStorage;
    protected frequency: number;

    constructor(
        stateStorage: StateStorage,
        bucketStorage: BucketStorage,
        frequency: number,
        source: URI,
    ) {
        super(source);
        this.stateStorage = stateStorage;
        this.bucketStorage = bucketStorage;
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

        // check if this page is full
        const nextPage = this.findNextPage(store);
        if (nextPage) {
            this.setCurrentPage(nextPage);
        }

        // remember which quads were just processed
        this.setPreviousData(data);
    }

    public processObject(object: RDFObject) {
        //this.bucketStorage.addObject(object);
        // this.tripleStorage...
    }

    protected async tick() {
        console.log(new Date(), this.getCurrentPage());
        const data = await this.fetchPage(this.getCurrentPage());
        this.processPage(data);
        const self = this;
        setTimeout(() => self.tick(), this.frequency);
    }

    protected findNextPage(store: N3.Store): string | undefined {
        // most common case: direction is known from handling previous pages
        if (this.getForwardDirection() === true) {
            return this.getHydraNext(store) || this.getNextRelation(store);
        } else if (this.getForwardDirection() === false) {
            return this.getHydraPrevious(store) || this.getPreviousRelation(store);
        }

        // base case: direction is still unknown;
        // this is where the feed starts
        const forwardPage = this.getHydraNext(store) || this.getNextRelation(store);
        if (forwardPage) {
            this.setForwardDirection(true);
            return forwardPage;
        }

        const backwardPage = this.getHydraPrevious(store) || this.getPreviousRelation(store);
        if (backwardPage) {
            this.setForwardDirection(false);
            return backwardPage;
        }
    }

    /*
     * Hypermedia methods
     */

    protected getNextRelation(store: N3.Store): string | undefined {
        // look for relation that are greater in time
        const relationIDs = store
            .getQuads(
                null,
                factory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                factory.namedNode("https://w3id.org/tree#GreaterThanRelation"),
                null,
            )
            .map((q) => q.subject.id);

        let firstID: string | undefined;
        let firstTime: string | undefined;

        // there may be multiple relations in this page
        for (const relationID of relationIDs) {
            const relationData = store.getQuads(relationID, null, null, null);

            const treeNodes = relationData.filter((q) => q.predicate.id === "https://w3id.org/tree#node");
            const treeValues = relationData.filter((q) => q.predicate.id === "https://w3id.org/tree#value");

            if (treeNodes && treeValues) {
                const treeNode = treeNodes[0].object.id;
                const treeValue = treeValues[0].object;

                // only use relations with a time value
                // remember the 'smallest' one
                if (treeValue.termType === "Literal" &&
                    treeValue.datatypeString === "http://www.w3.org/2001/XMLSchema#dateTime") {
                    if (!firstTime || treeValue.value < firstTime) {
                        firstID = treeNode;
                        firstTime = treeValue.value;
                    }
                }
            }
        }

        return firstID;
    }

    protected getPreviousRelation(store: N3.Store): string | undefined {
        // look for relation that are lesser in time
        const relationIDs = store
            .getQuads(
                null,
                factory.namedNode("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
                factory.namedNode("https://w3id.org/tree#LessThanRelation"),
                null,
            )
            .map((q) => q.subject.id);

        let lastID: string | undefined;
        let lastTime: string | undefined;

        // there may be multiple relations in this page
        for (const relationID of relationIDs) {
            const relationData = store.getQuads(relationID, null, null, null);

            const treeNodes = relationData.filter((q) => q.predicate.id === "https://w3id.org/tree#node");
            const treeValues = relationData.filter((q) => q.predicate.id === "https://w3id.org/tree#value");

            if (treeNodes && treeValues) {
                const treeNode = treeNodes[0].object.id;
                const treeValue = treeValues[0].object;

                // only use relations with a time value
                // remember the 'largest' one
                if (treeValue.termType === "Literal" &&
                    treeValue.datatypeString === "http://www.w3.org/2001/XMLSchema#dateTime") {
                    if (!lastTime || treeValue.value > lastTime) {
                        lastID = treeNode;
                        lastTime = treeValue.value;
                    }
                }
            }
        }

        return lastID;
    }

    protected getHydraNext(store: N3.Store): string | undefined {
        const quads = store.getQuads(null, factory.namedNode("http://www.w3.org/ns/hydra/core#next"), null, null);

        for (const quad of quads) {
            return quad.object.id;
        }
    }

    protected getHydraPrevious(store: N3.Store): string | undefined {
        const quads = store.getQuads(null, factory.namedNode("http://www.w3.org/ns/hydra/core#previous"), null, null);

        for (const quad of quads) {
            return quad.object.id;
        }
    }

    /*
     * State methods
     */

    protected getCurrentPage(): string {
        return this.stateStorage.get("currentPage") || this.sourceURI;
    }

    protected setCurrentPage(page: URI) {
        return this.stateStorage.set("currentPage", page);
    }

    protected getPreviousData(): Quad[] | undefined {
        const data = this.stateStorage.get("previousData");
        if (data) {
            return JSON.parse(data).map((q) => RdfString.stringQuadToQuad(q));
        }
    }

    protected setPreviousData(data: Quad[]) {
        return this.stateStorage.set(
            "previousData",
            JSON.stringify(data.map((q) => RdfString.quadToStringQuad(q)))
        );
    }

    protected getForwardDirection(): boolean | undefined {
        const data = this.stateStorage.get("forward");
        if (data) {
            return JSON.parse(data);
        }
    }

    protected setForwardDirection(value: boolean) {
        return this.stateStorage.set("forward", JSON.stringify(value));
    }
}

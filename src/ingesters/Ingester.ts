import factory = require("@rdfjs/data-model");
import ldfetch = require("ldfetch");
import N3 = require("n3");
import Queue = require("queue-fifo");

import { BlankNode, NamedNode, Quad } from "rdf-js";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";

export default abstract class Ingester {
    protected sourceURI: URI;

    constructor(source: URI) {
        this.sourceURI = source;
    }

    public async fetchPage(source: URI): Promise<Quad[]> {
        const fetch = new ldfetch({});
        const response = await fetch.get(source);
        return response.triples;
    }

    public abstract processPage(data: Quad[]): void;

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

    protected skolemize(source: URI, quad: Quad) {
        if (quad.subject.termType === "BlankNode") {
            if (quad.subject.value.indexOf("://") < 0) {
                quad.subject.value = `urn:${source}:${quad.subject.value}`;
            }
        }
        if (quad.object.termType === "BlankNode") {
            if (quad.object.value.indexOf("://") < 0) {
                quad.object.value = `urn:${source}:${quad.object.value}`;
            }
        }

        return quad;
    }

    protected buildObject(id: URI, store: N3.Store): RDFObject {
        const data: Quad[] = [];
        const done: Set<URI> = new Set(); // to avoid cycles
        done.add(id);

        const queue: Queue<NamedNode | BlankNode> = new Queue();
        queue.enqueue(factory.namedNode(id));
        queue.enqueue(factory.blankNode(id));

        while (!queue.isEmpty()) {
            const currentNode = queue.dequeue();
            if (currentNode) {
                const newData = store.getQuads(currentNode, null, null, null);

                for (const quad of newData) {
                    data.push(quad);
                    const objectType = quad.object.termType;

                    // if this quad refers to another entity, add it to the queue
                    if (objectType === "BlankNode" || objectType === "NamedNode") {
                        const object = quad.object as NamedNode | BlankNode;
                        if (!done.has(object.value)) {
                            // avoid revisiting already handled nodes
                            done.add(currentNode.value);
                            queue.enqueue(object);
                        }
                    }
                }
            }
        }

        // todo, add skolemization to kill blank nodes
        // idea: just replace value of blank nodes to something unique
        // keeping em blank

        return new RDFObject(id, data);
    }
}

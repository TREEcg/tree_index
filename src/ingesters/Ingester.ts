import factory = require("@rdfjs/data-model");
import ldfetch = require("ldfetch");
import N3 = require("n3");
import { BlankNode } from "n3";
import Queue = require("queue-fifo");

import { NamedNode, Quad } from "rdf-js";
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
    public abstract processObject(object: RDFObject): void;

    protected buildObject(id: URI, store: N3.Store): RDFObject {
        const data: Quad[] = [];
        const done: Set<URI> = new Set(); // to avoid cycles
        done.add(id);
        const queue: Queue<NamedNode | N3.BlankNode> = new Queue();
        queue.enqueue(factory.namedNode(id));

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

        return new RDFObject(id, data);
    }
}

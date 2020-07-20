import factory = require("@rdfjs/data-model");
import N3 = require("n3");
import * as RdfString from "rdf-string";

import { NamedNode, Quad } from "rdf-js";
import BucketStrategy from "../buckets/BucketStrategy";
import IdentityBucketStrategy from "../buckets/IdentityBucketStrategy";
import NGramBucketStrategy from "../buckets/NGramBucketStrategy";
import PrefixBucketStrategy from "../buckets/PrefixBucketStrategy";
import SuffixBucketStrategy from "../buckets/SuffixBucketStrategy";
import TimeIntervalBucketStrategy from "../buckets/TimeIntervalBucket";
import XYZTileBucketStrategy from "../buckets/XYZTileBucketStrategy";
import RDFEvent from "../entities/Event";
import Fragmentation from "../entities/Fragmentation";
import FragmentKind from "../entities/FragmentKind";
import EventStorage from "../persistence/events/EventStorage";
import FragmentationStorage from "../persistence/fragmentations/FragmentationStorage";
import FragmentStorage from "../persistence/fragments/FragmentStorage";
import StateStorage from "../state/StateStorage";
import { URI } from "../util/constants";
import Ingester from "./Ingester";
import EventStreamStorage from "../persistence/streams/EventStreamStorage";
import EntityStatus from "../entities/EntityStatus";

export default class EventStreamIngester extends Ingester {
    protected previousData: Quad[] | undefined;
    protected stateStorage: StateStorage;
    protected eventStreamStorage: EventStreamStorage;
    protected fragmentationStorage: FragmentationStorage;
    protected fragmentStorage: FragmentStorage;
    protected eventStorage: EventStorage;
    protected frequency: number;

    protected bucketStrategies: Map<string, BucketStrategy>;

    constructor(
        source: URI,
        frequency: number,
        stateStorage: StateStorage,
        eventStreamStorage: EventStreamStorage,
        fragmentationStorage: FragmentationStorage,
        fragmentStorage: FragmentStorage,
        eventStorage: EventStorage,
    ) {
        super(source);
        this.stateStorage = stateStorage;
        this.eventStreamStorage = eventStreamStorage;
        this.fragmentationStorage = fragmentationStorage;
        this.fragmentStorage = fragmentStorage;
        this.eventStorage = eventStorage;
        this.frequency = frequency;
        this.bucketStrategies = new Map();

        if (!this.getCurrentPage()) {
            this.setCurrentPage(source);
        }

        this.tick();
    }

    // returns true if this was the last page
    public async processPage(data: Quad[]): Promise<boolean> {
        const stream = await this.eventStreamStorage.getByID(this.sourceURI);
        if (!stream) {
            throw new Error("AAAAAAAAAAAAAAAAAAA");
        }

        const store: N3.Store = new N3.Store();
        store.addQuads(data);

        // only process new data
        if (this.previousData) {
            // data only gets added so subtract known data
            store.removeQuads(this.previousData);
        }

        // these members are new
        const memberPred = factory.namedNode("https://w3id.org/tree#member");
        const members: NamedNode[] = store.getQuads(null, memberPred, null, null)
            .map((q: Quad) => q.object)
            .filter((o) => o.termType === "NamedNode") as NamedNode[];

        // in case any new fragmentations have been added recently
        await this.refreshStrategies();

        // process as self-contained objects
        const objects = members.map((m) => this.buildEvent(m.value, store));
        objects
            .filter((o) => o !== undefined) // filter out broken events
            .forEach((e) => this.processEvent(e as RDFEvent));

        // check if this page is full
        const nextPage = this.findNextPage(store);
        if (nextPage) {
            this.setCurrentPage(nextPage);
        }

        // remember which quads were just processed
        this.previousData = data;

        if (nextPage) {
            return false;
        }

        // this was the last page
        stream.status = EntityStatus.ENABLED;
        this.eventStreamStorage.add(stream);

        return true;
    }

    public processEvent(event: RDFEvent) {
        this.eventStorage.add(this.sourceURI, event);
        for (const strategy of this.bucketStrategies.values()) {
            for (const bucket of strategy.labelObject(event)) {
                this.eventStorage.addToBucket(this.sourceURI, strategy.fragmentName, bucket.value, event);
            }
        }
    }

    public async refreshStrategies(): Promise<void> {
        for await (const fragmentation of this.fragmentationStorage.getAllByStream(this.sourceURI)) {
            if (!this.bucketStrategies.has(fragmentation.name)) {
                const strategy = this.createStrategy(fragmentation);
                this.bucketStrategies.set(fragmentation.name, strategy);
            }
        }
    }

    protected createStrategy(fragmentation: Fragmentation): BucketStrategy {
        switch (fragmentation.kind) {
            case FragmentKind.IDENTITY:
                return new IdentityBucketStrategy(
                    fragmentation,
                );
            case FragmentKind.NGRAM:
                return new NGramBucketStrategy(
                    fragmentation,
                    fragmentation.params["minLength"] || 2,
                    fragmentation.params["maxLength"] || 4,
                );
            case FragmentKind.PREFIX:
                return new PrefixBucketStrategy(
                    fragmentation,
                );
            case FragmentKind.SUFFIX:
                return new SuffixBucketStrategy(
                    fragmentation,
                );
            case FragmentKind.TIME_INTERVAL:
                return new TimeIntervalBucketStrategy(
                    fragmentation,
                    fragmentation.params["interval"] || 20 * 60 * 1000,
                );
            case FragmentKind.XYZ_TILE:
                return new XYZTileBucketStrategy(
                    fragmentation,
                    fragmentation.params["minZoom"] || 13,
                    fragmentation.params["maxZoom"] || 15,
                );
            default:
                throw new Error(`Unknown fragmentation ${fragmentation.kind}`);
        }
    }

    protected async tick() {
        console.log(new Date(), this.getCurrentPage());
        const data = await this.fetchPage(this.getCurrentPage());
        const finished = await this.processPage(data);
        // fetch 10 times faster if there are more pages
        const delay = finished ? this.frequency : this.frequency / 10;
        const self = this;
        setTimeout(() => self.tick(), delay);
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

    protected buildEvent(id: URI, store: N3.Store): RDFEvent | undefined {
        const object = this.buildObject(id, store);
        for (const quad of object.data) {
            if (quad.subject.value === id
                && quad.object.termType === "Literal"
                && quad.object.datatype.value === "http://www.w3.org/2001/XMLSchema#dateTime"
            ) {
                return new RDFEvent(object.id, object.data, quad.object.value);
            }
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

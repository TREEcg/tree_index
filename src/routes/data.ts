import express = require("express");
import asyncHandler = require("express-async-handler");
import jsonld = require("jsonld");
import { DATA_ROOT, EVENT_STORAGE, FRAGMENT_STORAGE, FRAGMENTATION_STORAGE, STREAM_STORAGE } from "../config";
import EntityStatus from "../entities/EntityStatus";
import RDFEvent from "../entities/Event";
import EventStream from "../entities/EventStream";
import createStrategy from "../util/createStrategy";

const router = express.Router();

// GET /data/:streamName/:fragmentationName/:fragment
router.get("/:streamName/:fragmentationName/:fragment", asyncHandler(async (req, res) => {
    const streamName = req.params.streamName;
    const fragmentationName = req.params.fragmentationName;
    const fragment = req.params.fragment;
    const since = req.query.since;
    const limit = 250;

    const stream = await STREAM_STORAGE.getByName(streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const canonicalStream = await STREAM_STORAGE.getByID(stream.sourceURI);
    const collectionURL = createCollectionURL(stream.name);
    const canonicalURL = new URL(createFragmentURL(stream.name, fragmentationName, fragment));
    if (since) {
        canonicalURL.searchParams.append("since", since);
    }

    if (streamName !== canonicalStream?.name) {
        // requested this resource under a different name
        res.redirect(301, canonicalURL);
        return;
    }

    const fragmentation = await FRAGMENTATION_STORAGE.getByName(stream.sourceURI, fragmentationName);
    if (!fragmentation || fragmentation.status !== EntityStatus.ENABLED) {
        throw new Error("Fragmentation name is invalid");
    }

    const g = EVENT_STORAGE.getAllByFragment(
        stream.sourceURI,
        fragmentationName,
        fragment,
        since,
    );

    let firstTime: Date | undefined;
    let lastTime: Date | undefined;
    const events: RDFEvent[] = [];

    let withNext = false;
    for await (const event of g) {
        if (!firstTime) {
            firstTime = event.timestamp;
        }

        lastTime = event.timestamp;

        events.push(event);
        if (events.length >= 2000) {
            // hard limit on 2000 events/page
            // there is no next page
            break;
        } else if (events.length >= limit && firstTime?.toISOString() !== lastTime.toISOString()) {
            // we stopped because the page is full
            // not because we ran out of data
            withNext = true;
            break;
        }
    }

    const quads = events.flatMap((e) => e.data);
    const payload: any[] = await jsonld.fromRDF(quads);
    payload.unshift({
        "@id": collectionURL,
        "https://w3id.org/tree#view": canonicalURL,
        "https://w3id.org/tree#member": payload.map((e) => {
            return { "@id": e["@id"] };
        }),
    });

    const relations: any[] = [];
    const strategy = createStrategy(fragmentation);
    const fragmentGen = FRAGMENT_STORAGE.getRelationsByFragment(stream.sourceURI, fragmentationName, fragment);
    for await (const frag of fragmentGen) {
        relations.push({
            "@type": strategy.getRelationType(),
            "https://w3id.org/tree#node": {
                "@id": createFragmentURL(streamName, fragmentationName, frag.value),
                "https://w3id.org/tree#remainingItems": frag.count,
            },
            "https://w3id.org/tree#path": fragmentation.shaclPath.map((p) => {
                return { "@id": p };
            }),
            "https://w3id.org/tree#value": {
                "@value": frag.value,
                "@type": frag.dataType,
            },
        });
    }

    if (withNext && lastTime) {
        const nextPath = createFragmentURL(stream.name, fragmentationName, fragment);
        relations.push(buildNextRelation(stream, nextPath, lastTime));
    }

    const blob = {
        "@id": canonicalURL,
        "https://w3id.org/tree#relation": relations,
        "@included": payload,
    };

    sendResponse(req, res, blob);
}));

// GET /data/:streamName/:fragmentationName
router.get("/:streamName/:fragmentationName", asyncHandler(async (req, res) => {
    const streamName = req.params.streamName;
    const fragmentationName: string = req.params.fragmentationName;

    const stream = await STREAM_STORAGE.getByName(streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const canonicalStream = await STREAM_STORAGE.getByID(stream.sourceURI);
    const collectionURL = createCollectionURL(streamName);
    const canonicalURL = createFragmentationURL(streamName, fragmentationName);
    if (streamName !== canonicalStream?.name) {
        res.redirect(301, canonicalURL);
        return;
    }

    const fragmentation = await FRAGMENTATION_STORAGE.getByName(stream.sourceURI, fragmentationName);
    if (!fragmentation || fragmentation.status !== EntityStatus.ENABLED) {
        throw new Error("Fragmentation name is invalid");
    }

    const strategy = createStrategy(fragmentation);

    const payload: any[] = [];
    payload.push({
        "@id": collectionURL,
        "https://w3id.org/tree#view": canonicalURL,
    });

    const relations: any[] = [];
    for await (const frag of FRAGMENT_STORAGE.getRootsByFragmentation(stream.sourceURI, fragmentationName)) {
        relations.push({
            "@type": strategy.getRelationType(),
            "https://w3id.org/tree#node": {
                "@id": createFragmentURL(streamName, fragmentationName, frag.value),
                "https://w3id.org/tree#remainingItems": frag.count,
            },
            "https://w3id.org/tree#path": fragmentation.shaclPath.map((p) => {
                return { "@id": p };
            }),
            "https://w3id.org/tree#value": {
                "@value": frag.value,
                "@type": frag.dataType,
            },
        });
    }

    const blob = {
        "@id": canonicalURL,
        "https://w3id.org/tree#relation": relations,
        "@included": payload,
    };

    sendResponse(req, res, blob);
}));

// GET /data/:streamName
router.get("/:streamName", asyncHandler(async (req, res) => {
    const streamName = req.params.streamName;
    const since = req.query.since;
    const limit = 250;
    const hardLimit = 2000;

    const stream = await STREAM_STORAGE.getByName(streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const canonicalStream = await STREAM_STORAGE.getByID(stream.sourceURI);
    const collectionURL = createCollectionURL(stream.name);
    const canonicalURL = new URL(createCollectionURL(stream.name));
    if (since) {
        canonicalURL.searchParams.append("since", since);
    }

    if (streamName !== canonicalStream?.name) {
        // requested this resource under a different name
        res.redirect(301, canonicalURL);
        return;
    }

    const g = EVENT_STORAGE.getAllByStream(
        stream.sourceURI,
        since,
    );

    let firstTime: Date | undefined;
    let lastTime: Date | undefined;
    const events: RDFEvent[] = [];

    let exhausted = true;
    for await (const event of g) {
        if (!firstTime) {
            firstTime = event.timestamp;
        }

        lastTime = event.timestamp;

        events.push(event);
        if ((events.length >= limit && firstTime?.toISOString() !== lastTime.toISOString()) ||
            events.length >= hardLimit) {
            // we stopped because the page is full
            // not because we ran out of data
            exhausted = false;
            break;
        }
    }

    const quads = events.flatMap((e) => e.data);
    const payload: any[] = await jsonld.fromRDF(quads);
    payload.unshift({
        "@id": collectionURL,
        "https://w3id.org/tree#view": canonicalURL,
        "https://w3id.org/tree#member": payload.map((e) => {
            return { "@id": e["@id"] };
        }),
    });

    const relations: any[] = [];
    const blob = {
        "@id": canonicalURL,
        "https://w3id.org/tree#relation": relations,
        "@included": payload,
    };

    if (!exhausted && lastTime) {
        const nextPath = createCollectionURL(stream.name);
        relations.push(buildNextRelation(stream, nextPath, lastTime));
    }

    sendResponse(req, res, blob);
}));

function buildNextRelation(stream: EventStream, next: string, time: Date) {
    const nextURL = new URL(next);
    nextURL.searchParams.append("since", time.toISOString());
    return {
        "@type": "https://w3id.org/tree#GreaterOrEqualThanRelation",
        "https://w3id.org/tree#node": {
            "@id": nextURL,
        },
        "https://w3id.org/tree#path": stream.timeProperty.map((p) => {
            return { "@id": p };
        }),
        "https://w3id.org/tree#value": {
            "@value": time.toISOString(),
            "@type": "http://www.w3.org/2001/XMLSchema#dateTime",
        },
    };
}

async function sendResponse(req, res, blob) {
    req.negotiate({
        "application/json;q=1.1": () => {
            res.type("application/ld+json; charset=utf-8");
            res.send(blob);
        },
        "application/n-quads;q=0.9": async () => {
            res.type("application/n-quads; charset=utf-8");
            res.send(await jsonld.toRDF(blob, { format: "application/n-quads" }));
        },
        "default": () => {
            res.type("application/ld+json; charset=utf-8");
            res.send(blob);
        },
    });
}

function createCollectionURL(streamName: string): string {
    return DATA_ROOT + `/${streamName}`;
}

function createFragmentationURL(
    streamName: string,
    fragmentationName: string,
): string {
    return DATA_ROOT + `/${streamName}/${fragmentationName}`;
}

function createFragmentURL(
    streamName: string,
    fragmentationName: string,
    bucketValue: string,
): string {
    return DATA_ROOT + `/${streamName}/${fragmentationName}/${bucketValue}`;
}

export default router;

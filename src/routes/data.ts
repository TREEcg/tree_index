import express = require("express");
import asyncHandler = require("express-async-handler");
import jsonld = require('jsonld');
import { EVENT_STORAGE, STREAM_STORAGE } from "../config";
import RDFEvent from "../entities/Event";

const router = express.Router();

// GET /data/:streamName/:fragmentName/:fragment
router.get("/:streamName/:fragmentName/:fragment", asyncHandler(async (req, res) => {
    const streamName = req.params.streamName;
    const fragmentName = req.params.fragmentName;
    const fragment = req.params.fragment;
    const since = req.query.since;
    const limit = 1000;

    const stream = await STREAM_STORAGE.getByName(streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const canonicalStream = await STREAM_STORAGE.getByID(stream.sourceURI);
    if (streamName !== canonicalStream?.name) {
        let canonicalUrl: string;
        if (since) {
            canonicalUrl = `/data/${canonicalStream?.name}/${fragmentName}/${fragment}?since=${since}`;
        } else {
            canonicalUrl = `/data/${canonicalStream?.name}/${fragmentName}/${fragment}`;
        }
        res.redirect(301, canonicalUrl);
        return;
    }

    const g = EVENT_STORAGE.getLimitedByFragment(
        stream.sourceURI,
        fragmentName,
        fragment,
        limit,
        since,
    );

    let firstTime: string | undefined;
    let lastTime: string | undefined;
    const events: RDFEvent[] = [];

    for await (const event of g) {
        if (!firstTime) {
            firstTime = event.timestamp;
        }

        lastTime = event.timestamp;

        events.push(event);
        if (events.length > limit && firstTime !== event.timestamp) {
            break;
        }
    }

    const quads = events.flatMap((e) => e.data);
    const doc = await jsonld.fromRDF(quads);
    res.json(doc);
}));

// GET /data/:streamName
router.get("/:streamName", asyncHandler(async (req, res) => {
    const streamName = req.params.streamName;
    const since = req.query.since;
    const limit = 1000;

    const stream = await STREAM_STORAGE.getByName(streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const canonicalStream = await STREAM_STORAGE.getByID(stream.sourceURI);
    if (streamName !== canonicalStream?.name) {
        let canonicalUrl: string;
        if (since) {
            canonicalUrl = `/data/${canonicalStream?.name}?since=${since}`;
        } else {
            canonicalUrl = `/data/${canonicalStream?.name}`;
        }
        res.redirect(301, canonicalUrl);
        return;
    }

    const g = EVENT_STORAGE.getLimitedByStream(
        stream.sourceURI,
        limit,
        since,
    );

    let firstTime: string | undefined;
    let lastTime: string | undefined;
    const events: RDFEvent[] = [];

    for await (const event of g) {
        if (!firstTime) {
            firstTime = event.timestamp;
        }

        lastTime = event.timestamp;

        events.push(event);
        if (events.length > limit && firstTime !== event.timestamp) {
            break;
        }
    }

    const quads = events.flatMap((e) => e.data);
    const doc = await jsonld.fromRDF(quads);
    res.json(doc);
}));

export default router;

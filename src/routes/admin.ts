import express = require("express");
import asyncHandler = require("express-async-handler");
const path = require('path');
import { Worker } from "worker_threads";
import { FRAGMENTATION_STORAGE, STREAM_STORAGE } from "../config";
import EntityStatus from "../entities/EntityStatus";
import EventStream from "../entities/EventStream";
import Fragmentation from "../entities/Fragmentation";
import FragmentKind from "../entities/FragmentKind";
import loadProperties from "../util/loadProperties";

const router = express.Router();

// GET /streams
router.get("/", asyncHandler(async (req, res) => {
    const streams: EventStream[] = [];

    for await (const stream of STREAM_STORAGE.getAll()) {
        streams.push(stream);
    }

    res.json(streams);
}));

// POST /streams
router.post("/", asyncHandler(async (req, res) => {
    const source = req.body.url;
    if (!source) {
        throw new Error("Source URI is invalid");
    }

    const name = req.body.name;
    if (!name) {
        throw new Error("Name is invalid");
    }

    const properties = await loadProperties(source);

    const stream = new EventStream(source, name, properties, EntityStatus.LOADING);
    await STREAM_STORAGE.add(stream);

    const workerPath = path.resolve(__dirname, "../workers/startIngester.js");

    new Worker(workerPath, {
        workerData: {
            uri: source,
            frequency: 60 * 1000, // 1 minute
        },
    });
    res.json({ status: "success", url: `/streams/${name}` });
}));

// GET /streams/:streamName
router.get("/:streamName", asyncHandler(async (req, res) => {
    const stream = await STREAM_STORAGE.getByName(req.params.streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const fragmentations: Fragmentation[] = [];
    for await (const fragmentation of FRAGMENTATION_STORAGE.getAllByStream(stream.sourceURI)) {
        fragmentations.push(fragmentation);
    }

    stream.fragmentations = fragmentations;

    const worker = new Worker('./worker.ts');
    res.json(stream);
}));

// GET /streams/:streamName/fragmentations
router.get("/:streamName/fragmentations", asyncHandler(async (req, res) => {
    const stream = await STREAM_STORAGE.getByName(req.params.streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const fragmentations: Fragmentation[] = [];
    for await (const fragmentation of FRAGMENTATION_STORAGE.getAllByStream(stream.sourceURI)) {
        fragmentations.push(fragmentation);
    }

    res.json(fragmentations);
}));

// POST /streams/:streamName/fragmentations
router.post("/:streamName/fragmentations", asyncHandler(async (req, res) => {
    const streamName = req.params.streamName;
    const stream = await STREAM_STORAGE.getByName(streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const name = req.body.name;
    if (!name) {
        throw new Error("Fragment name is missing");
    }

    const prop = req.body.property;
    if (!prop) {
        throw new Error("Property URI is missing");
    }

    const strategy = req.body.strategy;
    if (!strategy) {
        throw new Error("Strategy is missing");
    }
    if (Object.values(FragmentKind).indexOf(strategy) < 0) {
        throw new Error(`Unknown strategy name; valid values are ${Object.values(FragmentKind)}`);
    }

    const fragmentation = new Fragmentation(
        stream.sourceURI,
        name,
        [prop],
        strategy,
        req.body,
        EntityStatus.LOADING,
    );
    await FRAGMENTATION_STORAGE.add(fragmentation);

    res.json({ status: "success", url: `/streams/${streamName}/fragmentations/${name}` });
}));

// GET /streams/:streamName/fragmentations/:fragmentName
router.get("/:streamName/fragmentations/:fragmentName", asyncHandler(async (req, res) => {
    const stream = await STREAM_STORAGE.getByName(req.params.streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const fragment = await FRAGMENTATION_STORAGE.getByName(stream.sourceURI, req.params.fragmentName);
    if (!fragment) {
        throw new Error("Fragment name is invalid");
    }

    res.json(fragment);
}));

// POST /streams/:streamName/fragmentations/:fragmentName/enable
router.post("/:streamName/fragmentations/:fragmentName/enable", asyncHandler(async (req, res) => {
    const stream = await STREAM_STORAGE.getByName(req.params.streamName);
    if (!stream) {
        throw new Error("Stream name is invalid");
    }

    const fragment = await FRAGMENTATION_STORAGE.getByName(stream.sourceURI, req.params.fragmentName);
    if (!fragment) {
        throw new Error("Fragment name is invalid");
    }

    const enabled = req.body.enabled;
    if (!enabled) {
        throw new Error("Enabled field is missing");
    }

    if (enabled === "false") {
        if (fragment.status !== EntityStatus.ENABLED) {
            throw new Error(`Can't disable this fragment at the moment; status is ${fragment.status}`);
        }
        fragment.status = EntityStatus.DISABLED;
    }

    if (enabled === "true") {
        if (fragment.status !== EntityStatus.DISABLED) {
            throw new Error(`Can't enable this fragment at the moment; status is ${fragment.status}`);
        }
        fragment.status = EntityStatus.ENABLED;
    }

    await FRAGMENTATION_STORAGE.add(fragment);
    res.json({ status: "success" });
}));

export default router;

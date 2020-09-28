import express = require("express");
import asyncHandler = require("express-async-handler");
import path = require("path");
import { Worker } from "worker_threads";
import { ADMIN_DOMAIN, FRAGMENTATION_STORAGE, STREAM_STORAGE } from "../config";
import EntityStatus from "../entities/EntityStatus";
import EventStream from "../entities/EventStream";
import Fragmentation from "../entities/Fragmentation";
import FragmentKind from "../entities/FragmentKind";
import loadProperties, { getShowValue } from "../util/loadProperties";
import startIngester from "../util/startIngester";

const router = express.Router();

// GET /
router.get("/", asyncHandler(async (req, res) => {
    const streams: EventStream[] = [];

    for await (const stream of STREAM_STORAGE.getAll()) {
        streams.push(stream);
    }

    res.json(streams);
}));

// POST /
router.post("/", asyncHandler(async (req, res) => {
    const source = req.body.url;
    if (!source) {
        throw new Error("Source URI is invalid");
    }

    const name = req.body.name;
    if (!name) {
        throw new Error("Name is invalid");
    }

    const [existingStreamName, existingStreamID] = await Promise.all(
        [STREAM_STORAGE.getByName(name), STREAM_STORAGE.getByID(source)],
    );

    if (existingStreamName && existingStreamName.sourceURI !== source) {
        // make sure we don't change existing name -> event stream mappings
        throw new Error(`This stream name is already used for ${existingStreamName.sourceURI}`);
    }

    const properties = await loadProperties(source);
    let timeProperty = ["http://www.w3.org/ns/prov#generatedAtTime"];
    if (source === "https://streams.datapiloten.be/observations") {
        // FIXME, this shouldn't be hard coded
        timeProperty = ["http://www.w3.org/ns/sosa/resultTime"];
    }
    const stream = new EventStream(source, name, timeProperty, properties, EntityStatus.LOADING);
    if (existingStreamID) {
        stream.progress = existingStreamID.progress;
    }
    await STREAM_STORAGE.add(stream);

    if (!existingStreamID) {
        // start ingesting this stream if it is new
        startIngester(stream.sourceURI);
    }

    const streamURI = new URL(`/${name}`, ADMIN_DOMAIN);
    res.json({ status: "success", url: streamURI });
}));

// GET /:streamName
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
    res.json(stream);
}));

// GET /:streamName/fragmentations
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

// POST /:streamName/fragmentations
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

    let prop = req.body.property;
    if (!prop) {
        throw new Error("Property URI is missing");
    } else if (!(prop instanceof Array)) {
        // make it an array if needed
        prop = [prop];
    }

    let propertyLabel = req.body.propertyLabel;
    if (!propertyLabel) {
        propertyLabel = getShowValue(prop);
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
        prop,
        propertyLabel,
        strategy,
        req.body,
        EntityStatus.LOADING,
    );
    await FRAGMENTATION_STORAGE.add(fragmentation);

    const workerPath = path.resolve(__dirname, "../workers/addFragmentation.js");
    // tslint:disable-next-line: no-unused-expression
    new Worker(workerPath, {
        workerData: {
            fragmentation,
        },
    });

    const fragmentURI = new URL(`/${streamName}/fragmentations/${name}`, ADMIN_DOMAIN);
    res.json({ status: "success", url: fragmentURI });
}));

// GET /:streamName/fragmentations/:fragmentName
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

// POST /:streamName/fragmentations/:fragmentName/enable
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

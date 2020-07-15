import cassandra = require("cassandra-driver");

import DummyStageStorage from "./state/DummyStateStorage";

import EventStream from "./entities/EventStream";
import Fragmentation from "./entities/Fragmentation";
import FragmentKind from "./entities/FragmentKind";
import CassandraFragmentationStorage from "./persistence/fragmentations/CassandraFragmentationStorage";
import CassandraEventStreamStorage from "./persistence/streams/CassandraEventStreamStorage";

const state = new DummyStageStorage("AA");
const client = new cassandra.Client({
    contactPoints: ["172.17.0.2:9042"],
    localDataCenter: "datacenter1",
});

async function testStream() {
    const es = new CassandraEventStreamStorage(state, client);

    const stream = new EventStream("https://streams.datapiloten.be/sensors", "sensors");
    await es.add(stream);
    for await (const temp of es.getAll()) {
        console.log(temp);
    }

    console.log(await es.getByID("https://streams.datapiloten.be/sensors"));
    console.log(await es.getByName("sensors"));
}

async function testFragmentation() {
    const fs = new CassandraFragmentationStorage(state, client);

    const fragmentation = new Fragmentation(
        "https://streams.datapiloten.be/sensors",
        "tile",
        ["http://www.opengis.net/ont/geosparql#asWKT"],
        FragmentKind.XYZ_TILE,
        {
            minZoom: 13,
            maxZoom: 15,
        });
    await fs.add(fragmentation);
    for await (const temp of fs.getAllByStream("https://streams.datapiloten.be/sensors")) {
        console.log(temp);
    }

    console.log(await fs.getByName("https://streams.datapiloten.be/sensors", "tile"));
}

async function test() {
    await testStream();
    await testFragmentation();
}

test();

/*
const ingesterState = new DummyStageStorage("aaaa");

const bucketStrategies: BucketStrategy[] = [];
bucketStrategies.push(new TimeIntervalBucketStrategy(["http://www.w3.org/ns/prov#generatedAtTime"], 10000));
bucketStrategies.push(new XYZTileBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"], 13, 15));
bucketStrategies.push(new SuffixBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"]));
bucketStrategies.push(new NGramBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"], 2, 4));
const bucketStore = new CassandraBucketStorage("bbb", bucketStrategies);

const x = new EventStreamIngester(
    ingesterState,
    bucketStore,
    2000,
    "https://streams.datapiloten.be/sensors",
);
*/

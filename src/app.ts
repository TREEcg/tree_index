import bodyParser = require('body-parser');
import express = require("express");
import adminRoutes from "./routes/admin";

const app = express();

// body parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// CORS
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use("/streams", adminRoutes);

// errors
app.use((err: any, req, res, next) => {
    res.status(err.status || 500);
    res.json({ status: "failure", msg: err.message });
});

app.set("port", process.env.PORT || 3000);

const server = app.listen(app.get("port"), () => {
    console.debug("Express server listening on port " + server.address().port);
});

/*

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

async function testFragment() {
    const fs = new CassandraFragmentStorage(client);

    const fragment1 = new Fragment(
        "https://streams.datapiloten.be/sensors",
        "tile",
        "13_1_2",
    );
    const fragment2 = new Fragment(
        "https://streams.datapiloten.be/sensors",
        "tile",
        "13_1_8",
    );
    await Promise.all([fs.add(fragment1), fs.add(fragment2)]);

    for await (const temp of fs.getAllByFragmentation("https://streams.datapiloten.be/sensors", "tile")) {
        console.log(temp);
    }
}

async function testAllEvents() {
    const e = new CassandraEventStorage(client);
    let i = 0;

    console.log(new Date());
    for await (const _ of e.getAllByStream("https://streams.datapiloten.be/sensors")) {
        i++;
    }
    console.log(new Date());
    console.log(i);
}

async function testGetBucket() {
    const e = new CassandraEventStorage(client);
    let i = 0;

    console.log(new Date());
    const g = e.getLimitedByFragment("https://streams.datapiloten.be/sensors", "tile", "13_4196_2733", 2000, "2020-07-15");
    for await (const _ of g) {
        i++;
    }
    console.log(new Date());
    console.log(i);
}

async function addPrefixFragmentation() {
    const fs = new CassandraFragmentationStorage(state, client);
    const es = new CassandraEventStorage(client);

    const fragmentation1 = new Fragmentation(
        "https://streams.datapiloten.be/sensors",
        "prefix",
        ["http://www.opengis.net/ont/geosparql#asWKT"],
        FragmentKind.PREFIX,
        {},
    );

    await fs.add(fragmentation1);
    const bucketStrategy = new PrefixBucketStrategy(fragmentation1);
    console.log(new Date());
    let i = 0;
    for await (const event of es.getAllByStream("https://streams.datapiloten.be/sensors")) {
        for (const bucket of bucketStrategy.labelObject(event)) {
            await es.addToBucket(bucket.streamID, bucket.fragmentName, bucket.value, event);
        }
        i += 1;
        if (i % 1000 === 0) {
            console.log(new Date(), i / 1000);
        }
    }
    console.log(new Date());
}
*/

async function test() {
    // await testStream();
    // await testFragmentation();
    // await testFragment();

    /*
    const x = new EventStreamIngester(
        "https://streams.datapiloten.be/sensors",
        500,
        state,
        new CassandraFragmentationStorage(state, client),
        new CassandraFragmentStorage(client),
        new CassandraEventStorage(client),
    );
    */

    // testGetBucket();

    // addPrefixFragmentation();
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

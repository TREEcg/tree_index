import BucketStrategy from "./buckets/BucketStrategy";
import DummyBucketStorage from "./buckets/DummyBucketStorage";
import PrefixBucketStrategy from "./buckets/PrefixBucketStrategy";
import SuffixBucketStrategy from "./buckets/SuffixBucketStrategy";
import EventStreamIngester from "./ingesters/EventStreamIngester";
import DummyStageStorage from "./state/DummyStateStorage";
import NGramBucketStrategy from "./buckets/NGramBucketStrategy";
import TimeIntervalBucketStrategy from "./buckets/TimeIntervalBucket";
import XYZTileBucketStrategy from "./buckets/XYZTileBucketStrategy";

const ingesterState = new DummyStageStorage("aaaa");

const bucketStrategies: BucketStrategy[] = [];
//bucketStrategies.push(new TimeIntervalBucketStrategy(["http://www.w3.org/ns/prov#generatedAtTime"], 10000));
bucketStrategies.push(new XYZTileBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"], 12, 15));
//bucketStrategies.push(new SuffixBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"]));
const bucketStore = new DummyBucketStorage("bbb", bucketStrategies);

const x = new EventStreamIngester(
    ingesterState,
    bucketStore,
    2000,
    "https://streams.datapiloten.be/sensors",
);

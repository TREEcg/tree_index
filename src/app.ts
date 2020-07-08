import BucketStrategy from "./buckets/BucketStrategy";
import DummyBucketStorage from "./buckets/DummyBucketStorage";
import PrefixBucketStrategy from "./buckets/PrefixBucketStrategy";
import SuffixBucketStrategy from "./buckets/SuffixBucketStrategy";
import EventStreamIngester from "./ingesters/EventStreamIngester";
import DummyStageStorage from "./state/DummyStateStorage";

const ingesterState = new DummyStageStorage("aaaa");

const bucketStrategies: BucketStrategy[] = [];
bucketStrategies.push(new PrefixBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"]));
bucketStrategies.push(new SuffixBucketStrategy(["http://www.opengis.net/ont/geosparql#asWKT"]));
const bucketStore = new DummyBucketStorage("bbb", bucketStrategies);

const x = new EventStreamIngester(
    ingesterState,
    bucketStore,
    2000,
    "https://streams.datapiloten.be/sensors",
);

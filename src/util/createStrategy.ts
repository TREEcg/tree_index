import BucketStrategy from "../buckets/BucketStrategy";
import IdentityBucketStrategy from "../buckets/IdentityBucketStrategy";
import NGramBucketStrategy from "../buckets/NGramBucketStrategy";
import PrefixBucketStrategy from "../buckets/PrefixBucketStrategy";
import SuffixBucketStrategy from "../buckets/SuffixBucketStrategy";
import TimeIntervalBucketStrategy from "../buckets/TimeIntervalBucket";
import XYZTileBucketStrategy from "../buckets/XYZTileBucketStrategy";
import Fragmentation from "../entities/Fragmentation";
import FragmentKind from "../entities/FragmentKind";

// tslint:disable: no-string-literal
export default function createStrategy(fragmentation: Fragmentation): BucketStrategy {
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

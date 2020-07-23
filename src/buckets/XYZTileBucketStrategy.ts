import wkt = require("terraformer-wkt-parser");
import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";
import FragmentStorage from "../persistence/fragments/FragmentStorage";
import Fragment from "../entities/Fragment";
import FragmentChain from "../entities/FragmentChain";

export default class XYZTileBucketStrategy extends BucketStrategy {
    protected minZoom: number;
    protected maxZoom: number;

    constructor(fragmentation: Fragmentation, minZoom: number, maxZoom: number) {
        super(fragmentation);
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
    }

    public labelObject(object: RDFObject): FragmentChain[] {
        const result: FragmentChain[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            const geojson = wkt.parse(value);
            const [minLon, minLat, maxLon, maxLat] = (geojson.bbox as any)();
            const minTileX = this.long2tile(minLon, this.minZoom);
            const maxTileX = this.long2tile(maxLon, this.minZoom);
            const minTileY = this.lat2tile(minLat, this.minZoom);
            const maxTileY = this.lat2tile(maxLat, this.minZoom);

            for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
                for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
                    result.push(this.help(type, this.minZoom, tileX, tileY));
                }
            }
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#GeospatiallyContainsRelation";
    }

    protected getBucket(zoom, x, y, type): Bucket {
        const k = `${zoom}_${x}_${y}`;
        if (!this.buckets.has(k)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, k, type);
            this.buckets.set(k, bucket);
        }

        return this.buckets.get(k) as Bucket;
    }

    private help(dataType: string, zoom: number, tileX: number, tileY: number): FragmentChain {
        let children;
        if (zoom === this.maxZoom) {
            children = [];
        } else {
            children = [
                this.help(dataType, zoom + 1, tileX * 2,     tileY * 2),
                this.help(dataType, zoom + 1, tileX * 2 + 1, tileY * 2),
                this.help(dataType, zoom + 1, tileX * 2,     tileY * 2 + 1),
                this.help(dataType, zoom + 1, tileX * 2 + 1, tileY * 2 + 1),
            ];
        }
        const fragment = this.getBucket(zoom, tileX, tileY, dataType);
        return new FragmentChain(fragment, children);
    }

    private long2tile(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }
    private lat2tile(lat, zoom) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
            1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }
}

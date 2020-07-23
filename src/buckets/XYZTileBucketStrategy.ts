import wkt = require("terraformer-wkt-parser");
import Bucket from "../entities/Fragment";
import Fragmentation from "../entities/Fragmentation";
import RDFObject from "../entities/RDFObject";
import { URI } from "../util/constants";
import BucketStrategy from "./BucketStrategy";

export default class XYZTileBucketStrategy extends BucketStrategy {
    protected minZoom: number;
    protected maxZoom: number;

    constructor(fragmentation: Fragmentation, minZoom: number, maxZoom: number) {
        super(fragmentation);
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
    }

    public labelObject(object: RDFObject): Bucket[] {
        const result: Bucket[] = [];
        const values = this.selectValues(object);
        const type = this.selectDataType(object);
        for (const value of values) {
            const geojson = wkt.parse(value);
            const [minLon, minLat, maxLon, maxLat] = (geojson.bbox as any)();
            for (let zoom = this.minZoom; zoom <= this.maxZoom; zoom++) {
                const minTileX = this.long2tile(minLon, zoom);
                const maxTileX = this.long2tile(maxLon, zoom);
                const minTileY = this.lat2tile(minLat, zoom);
                const maxTileY = this.lat2tile(maxLat, zoom);

                for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
                    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
                        result.push(this.getBucket(zoom, tileX, tileY, type));
                    }
                }
            }
        }

        return result;
    }

    public getRelationType(): URI {
        return "https://w3id.org/tree#GeospatiallyContainsRelation";
    }

    public filterIndexFragments(input: AsyncGenerator<Bucket>): Promise<Bucket[]> {
        // return list of zoom level 4 tiles, which contain links to zoom level 8 tiles, ...
        throw new Error("Method not implemented.");
    }

    protected getBucket(zoom, x, y, type): Bucket {
        const k = `${zoom}_${x}_${y}`;
        if (!this.buckets.has(k)) {
            const bucket = new Bucket(this.streamID, this.fragmentName, k, type);
            this.buckets.set(k, bucket);
        }

        return this.buckets.get(k) as Bucket;
    }

    private long2tile(lon, zoom) {
        return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
    }
    private lat2tile(lat, zoom) {
        return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) +
            1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
    }
}

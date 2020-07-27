import { STREAM_STORAGE } from "../config";
import EntityStatus from "../entities/EntityStatus";
import startIngester from "./startIngester";

export default async function resumeIngesters() {
    for await (const stream of STREAM_STORAGE.getAll()) {
        if (stream.status !== EntityStatus.DISABLED) {
            startIngester(stream.sourceURI);
        }
    }
}

import rdfDereferencer from "rdf-dereference";
import ShaclProperty from "../entities/ShaclProperty";
import { URI } from "./constants";

/**
 * Fetch a specific data stream and add parameters to list
 * @param url: Url that defines the data stream
 * @returns {Promise<[]>}
 */
export default async function loadProperties(source: URI): Promise<ShaclProperty[]> {
    const features = {};
    const nodes = {};
    const properties = {};

    return new Promise(async (res) => {
        const { quads } = await rdfDereferencer.dereference(source);
        quads.on("data", (quad) => {
            if (quad.predicate.value === "https://www.w3.org/ns/shacl#node") {
                nodes[quad.object.value] = quad.subject.value;
            } else if (quad.predicate.value === "https://www.w3.org/ns/shacl#property") {
                properties[quad.object.value] = quad.subject.value;
            } else if (quad.predicate.value === "https://www.w3.org/ns/shacl#path") {
                features[quad.subject.value] = {
                    subject: quad.object.value,
                    grouped: false,
                };
            }
        }).on("end", async () => {
            const featureValues = combine(features, nodes, properties);
            const result: ShaclProperty[] = [];
            for (const [text, value] of Object.entries(featureValues)) {
                result.push(new ShaclProperty(text, value as string));
            }
            res(result);
        });
    });
}

/**
 * Combine nested parameters
 * @param features
 * @param nodes
 * @param properties
 * @returns {{}}: parameter: [URI's defining that parameter]
 */
function combine(features, nodes, properties) {
    const parameterList = {};
    for (const key in features) {
        // Check if feature is not defining
        if (features[key].grouped === false) {
            let current = key;
            const urlList = [features[current].subject];
            let stop = false;
            // See if features can be linked together
            while (!stop) {
                if (current !== key) {
                    features[current].grouped = true;
                }
                if (current in properties) {
                    if (properties[current] in nodes) {
                        urlList.push(features[nodes[properties[current]]].subject);
                        current = nodes[properties[current]];
                        continue;
                    }
                }
                stop = true;
            }
            // Determine show value of a feature
            const value = getShowValue(urlList);
            parameterList[value] = urlList;
        }

    }
    return parameterList;
}

/**
 * Generate a display name for a list of property URI's
 * @param url_list
 * @returns {string}: name for the parameter
 */
export function getShowValue(urlList) {
    let returnValue = "";
    // Get parameter from every URI and combine them
    urlList.reverse().forEach((url) => {
        const splitToken = (url.includes("#")) ? "#" : "/";
        const value = url.split(splitToken).pop();
        returnValue = returnValue.concat(value + " - ");
    });
    return returnValue.substring(0, returnValue.length - 3);
}

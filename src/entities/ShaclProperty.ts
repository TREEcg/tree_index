import { URI } from "../util/constants";

export default class ShaclProperty {
    public text: string;
    public value: URI;

    constructor(text: string, value: URI) {
        this.text = text;
        this.value = value;
    }
}

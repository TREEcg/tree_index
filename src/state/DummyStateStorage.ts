import StateStorage from "./StateStorage";

export default class DummyStageStorage extends StateStorage {
    protected data: object;

    constructor(prefix: string) {
        super(prefix);
        this.data = {};
    }

    public set(key: string, value: string) {
        this.data[key] = value;
    }

    public get(key: string): string | null {
        return this.data[key];
    }
}
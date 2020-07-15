export default abstract class StateStorage {
    protected prefix: string;

    constructor(prefix: string) {
        this.prefix = prefix;
    }

    public abstract get(key: string): string | null;
    public abstract set(key: string, value: string): void;
}

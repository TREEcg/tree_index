export default abstract class StateStorage {
    public abstract get(key: string): Promise<string | undefined>;
    public abstract set(key: string, value: string): void;
}

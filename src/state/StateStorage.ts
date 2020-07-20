export default abstract class StateStorage {
    public abstract get(key: string): string | null;
    public abstract set(key: string, value: string): void;
}

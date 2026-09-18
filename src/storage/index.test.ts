import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, onStorageError, storage } from "./index";

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    const value = this.map.get(key);
    return value === undefined ? null : value;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

let memory: MemoryStorage;

beforeEach(() => {
  memory = new MemoryStorage();
  Object.defineProperty(globalThis, "localStorage", { value: memory, configurable: true, writable: true });
});

afterEach(() => {
  onStorageError(null);
  vi.restoreAllMocks();
});

describe("browser storage driver", () => {
  it("round-trips a value through save and load", async () => {
    const payload = { accounts: [{ id: "a1", name: "JK" }] };
    await storage.save(STORAGE_KEY, payload);
    await expect(storage.load(STORAGE_KEY)).resolves.toEqual(payload);
  });

  it("returns null when nothing is stored", async () => {
    await expect(storage.load("missing")).resolves.toBeNull();
  });

  it("flush writes synchronously", () => {
    storage.flush(STORAGE_KEY, { ok: true });
    expect(JSON.parse(memory.getItem(STORAGE_KEY) ?? "null")).toEqual({ ok: true });
  });

  it("reports and rethrows when stored data is corrupt", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    memory.setItem(STORAGE_KEY, "{not-json");
    const onError = vi.fn();
    onStorageError(onError);

    await expect(storage.load(STORAGE_KEY)).rejects.toThrow();
    expect(onError).toHaveBeenCalledOnce();
    // The unreadable payload is left on disk for manual recovery.
    expect(memory.getItem(STORAGE_KEY)).toBe("{not-json");
  });

  it("reports save failures without throwing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(memory, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });
    const onError = vi.fn();
    onStorageError(onError);

    await expect(storage.save(STORAGE_KEY, { a: 1 })).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledOnce();
  });
});

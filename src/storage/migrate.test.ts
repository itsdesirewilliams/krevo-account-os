import { describe, expect, it } from "vitest";
import { collectLegacyEntries, isKvKey } from "./migrate";

function fakeStorage(entries: Record<string, string>) {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    key: (index: number) => keys[index] ?? null,
    getItem: (key: string) => entries[key] ?? null,
  };
}

describe("isKvKey", () => {
  it("matches only prefixed keys", () => {
    expect(isKvKey("krevo_state_v2")).toBe(true);
    expect(isKvKey("other")).toBe(false);
  });
});

describe("collectLegacyEntries", () => {
  it("collects only prefixed, JSON-parsable entries", () => {
    const entries = collectLegacyEntries(
      fakeStorage({
        krevo_state_v2: JSON.stringify({ accounts: [] }),
        krevo_tasks_v1: JSON.stringify({ tasks: [] }),
        unrelated: JSON.stringify({ x: 1 }),
        krevo_broken: "{not json",
      }),
    );
    expect(entries.map((e) => e.key).sort()).toEqual(["krevo_state_v2", "krevo_tasks_v1"]);
    const byKey = Object.fromEntries(entries.map((e) => [e.key, e.value]));
    expect(byKey.krevo_state_v2).toEqual({ accounts: [] });
    expect(byKey.krevo_tasks_v1).toEqual({ tasks: [] });
  });

  it("returns nothing for an empty store", () => {
    expect(collectLegacyEntries(fakeStorage({}))).toEqual([]);
  });
});

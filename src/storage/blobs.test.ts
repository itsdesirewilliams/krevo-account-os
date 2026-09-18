import { describe, expect, it } from "vitest";
import { loadBlob, removeBlob, saveBlob } from "./blobs";

describe("blob storage (in-memory fallback under node)", () => {
  it("round-trips and removes a blob", async () => {
    const blob = new Blob(["hello sop"], { type: "text/plain" });
    await saveBlob("k1", blob);

    const loaded = await loadBlob("k1");
    expect(loaded).not.toBeNull();
    expect(await loaded?.text()).toBe("hello sop");

    await removeBlob("k1");
    expect(await loadBlob("k1")).toBeNull();
  });

  it("returns null for a missing key", async () => {
    expect(await loadBlob("missing")).toBeNull();
  });
});

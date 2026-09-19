import { describe, expect, it } from "vitest";
import { resolveEndpointOverride } from "./updater";

describe("resolveEndpointOverride", () => {
  it("treats blank input as 'use the built-in endpoint'", () => {
    expect(resolveEndpointOverride("")).toBeNull();
    expect(resolveEndpointOverride("   ")).toBeNull();
    expect(resolveEndpointOverride(null)).toBeNull();
    expect(resolveEndpointOverride(undefined)).toBeNull();
  });

  it("trims and keeps a real override", () => {
    expect(resolveEndpointOverride("  https://example.com/latest.json  ")).toBe("https://example.com/latest.json");
  });

  it("keeps the production Krevo manifest URL", () => {
    const url = "https://github.com/itsdesirewilliams/krevo-account-os/releases/latest/download/latest.json";
    expect(resolveEndpointOverride(url)).toBe(url);
  });
});

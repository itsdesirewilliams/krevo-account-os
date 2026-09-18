import { describe, expect, it } from "vitest";
import { defaultSettingsData, normalizeSettingsData, updateSettings } from "./settings.repository";

describe("normalizeSettingsData", () => {
  it("returns defaults for junk input", () => {
    expect(normalizeSettingsData(null)).toEqual(defaultSettingsData());
    expect(normalizeSettingsData("nope")).toEqual(defaultSettingsData());
  });

  it("trims strings and repairs the interval", () => {
    const settings = normalizeSettingsData({
      manifestUrl: "  https://example.com/latest.json  ",
      publicKeyOverride: "  key  ",
      checkIntervalMinutes: 12.6,
    });
    expect(settings.manifestUrl).toBe("https://example.com/latest.json");
    expect(settings.publicKeyOverride).toBe("key");
    expect(settings.checkIntervalMinutes).toBe(13);
  });

  it("clamps a negative interval to 0 and keeps booleans", () => {
    const settings = normalizeSettingsData({ checkIntervalMinutes: -5, autoUpdate: false, checkOnLaunch: false });
    expect(settings.checkIntervalMinutes).toBe(0);
    expect(settings.autoUpdate).toBe(false);
    expect(settings.checkOnLaunch).toBe(false);
  });
});

describe("updateSettings", () => {
  it("applies a patch immutably and re-normalizes", () => {
    const base = defaultSettingsData();
    const next = updateSettings(base, { manifestUrl: "  url  ", checkIntervalMinutes: 0 });
    expect(next.manifestUrl).toBe("url");
    expect(next.checkIntervalMinutes).toBe(0);
    expect(base.manifestUrl).toBe("");
  });
});

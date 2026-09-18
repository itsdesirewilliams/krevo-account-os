/*
 * Settings repository: pure, immutable helpers over SettingsData.
 * No React, no storage, no Tauri calls.
 */
import type { SettingsData } from "./settings.types";

export const SETTINGS_KEY = "krevo_settings_v1";

export function defaultSettingsData(): SettingsData {
  return {
    autoUpdate: true,
    manifestUrl: "",
    publicKeyOverride: "",
    checkOnLaunch: true,
    checkIntervalMinutes: 60,
  };
}

const asString = (value: unknown, fallback: string): string => (typeof value === "string" ? value : fallback);

export function normalizeSettingsData(raw: unknown): SettingsData {
  const base = defaultSettingsData();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SettingsData>;
  const interval = typeof r.checkIntervalMinutes === "number" && Number.isFinite(r.checkIntervalMinutes)
    ? Math.max(0, Math.round(r.checkIntervalMinutes))
    : base.checkIntervalMinutes;
  return {
    autoUpdate: r.autoUpdate !== false,
    manifestUrl: asString(r.manifestUrl, base.manifestUrl).trim(),
    publicKeyOverride: asString(r.publicKeyOverride, base.publicKeyOverride).trim(),
    checkOnLaunch: r.checkOnLaunch !== false,
    checkIntervalMinutes: interval,
  };
}

export function updateSettings(data: SettingsData, patch: Partial<SettingsData>): SettingsData {
  return normalizeSettingsData({ ...data, ...patch });
}

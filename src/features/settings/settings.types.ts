/** Settings-owned persisted data (Phase 4). */

/** Krevo ships one design system in two typographic faces. */
export type InterfaceFace = "geist" | "bricolage";

export interface SettingsData {
  /** Interface face: Midnight/Geist or Bricolage personality. */
  interfaceFace: InterfaceFace;
  /** Master switch for the updater. */
  autoUpdate: boolean;
  /** GitHub Releases manifest URL, e.g. .../releases/latest/download/latest.json */
  manifestUrl: string;
  /** Public-key override for rotation; empty means "use the baked fallback". */
  publicKeyOverride: string;
  /** Check for updates when the app launches. */
  checkOnLaunch: boolean;
  /** Periodic check interval in minutes; 0 disables periodic checks. */
  checkIntervalMinutes: number;
}

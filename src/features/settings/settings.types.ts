/** Settings-owned persisted data (Phase 4). */

/** Krevo ships one design system in two typographic faces. */
export type InterfaceFace = "geist" | "bricolage";

export interface SettingsData {
  /** Interface face: Midnight/Geist or Bricolage personality. */
  interfaceFace: InterfaceFace;
  /** Master switch for the updater. */
  autoUpdate: boolean;
  /**
   * Optional manifest-URL override. Empty (the default) means "use the built-in
   * Krevo endpoint" baked into tauri.conf.json (`plugins.updater.endpoints`).
   */
  manifestUrl: string;
  /** Public-key override for rotation; empty means "use the baked fallback". */
  publicKeyOverride: string;
  /** Check for updates when the app launches. */
  checkOnLaunch: boolean;
  /** Periodic check interval in minutes; 0 disables periodic checks. */
  checkIntervalMinutes: number;
}

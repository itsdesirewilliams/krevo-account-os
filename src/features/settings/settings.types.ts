/** Settings-owned persisted data (Phase 4). */

export interface SettingsData {
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

/*
 * Updater façade. The stock JS plugin API cannot set endpoints/keys at runtime,
 * so we call custom Rust commands (see src-tauri/src/lib.rs) that build the
 * updater with the configured manifest URL and public-key override.
 *
 * The private signing key never exists here: updates are verified against the
 * baked fallback public key, or the user-entered override for key rotation.
 */
import { isTauri } from "../../storage";

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  notes: string;
  date: string | null;
}

export type UpdateDownloadEvent =
  | { event: "Started"; data: { contentLength: number | null } }
  | { event: "Progress"; data: { chunkLength: number } }
  | { event: "Finished" };

/** Updates only run in the installed desktop app. */
export const updatesSupported = isTauri;

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

const errorMessage = (cause: unknown): string => (cause instanceof Error ? cause.message : String(cause));

export async function currentVersion(): Promise<string> {
  if (!isTauri()) return "";
  const { getVersion } = await import("@tauri-apps/api/app");
  return getVersion();
}

export async function checkForUpdate(manifestUrl: string, publicKeyOverride: string): Promise<UpdateInfo | null> {
  return invoke<UpdateInfo | null>("check_for_update", {
    endpoint: manifestUrl,
    pubkey: publicKeyOverride.trim() === "" ? null : publicKeyOverride.trim(),
  });
}

export async function installUpdate(onEvent: (event: UpdateDownloadEvent) => void): Promise<void> {
  const { Channel } = await import("@tauri-apps/api/core");
  const channel = new Channel<UpdateDownloadEvent>();
  channel.onmessage = onEvent;
  await invoke("install_update", { onEvent: channel });
}

export async function relaunchApp(): Promise<void> {
  const { relaunch } = await import("@tauri-apps/plugin-process");
  await relaunch();
}

export { errorMessage };

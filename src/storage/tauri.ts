/*
 * Tauri desktop storage driver.
 *
 * Documents live in SQLite (key/value table) through @tauri-apps/plugin-sql;
 * binary attachments (SOP files) live in the app-data directory through
 * @tauri-apps/plugin-fs. All SQL is parameterized. The Tauri modules are
 * imported lazily so the browser build never loads them.
 */
import type DatabaseType from "@tauri-apps/plugin-sql";
import { collectLegacyEntries } from "./migrate";

let databasePromise: Promise<DatabaseType> | null = null;

/** One-time copy of prefixed localStorage data into SQLite on first launch. */
async function migrateFromLocalStorage(db: DatabaseType): Promise<void> {
  if (typeof window === "undefined" || !window.localStorage) return;
  const entries = collectLegacyEntries(window.localStorage);
  for (const entry of entries) {
    await db.execute("INSERT OR REPLACE INTO kv (key, value) VALUES ($1, $2)", [
      entry.key,
      JSON.stringify(entry.value),
    ]);
  }
}

async function sqlite(): Promise<DatabaseType> {
  databasePromise ??= (async () => {
    const { default: Database } = await import("@tauri-apps/plugin-sql");
    const db = await Database.load("sqlite:krevo.db");
    await db.execute("CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    const existing = await db.select<{ key: string }[]>("SELECT key FROM kv LIMIT 1");
    if (existing.length === 0) await migrateFromLocalStorage(db);
    return db;
  })();
  return databasePromise;
}

async function blobDirectory(): Promise<string> {
  const { appDataDir, join } = await import("@tauri-apps/api/path");
  return join(await appDataDir(), "sops");
}

async function blobPath(key: string): Promise<string> {
  const { join } = await import("@tauri-apps/api/path");
  return join(await blobDirectory(), key);
}

export const tauriStorage = {
  async load(key: string): Promise<unknown> {
    const db = await sqlite();
    const rows = await db.select<{ value: string }[]>("SELECT value FROM kv WHERE key = $1", [key]);
    const row = rows[0];
    if (!row) return null;
    return JSON.parse(row.value) as unknown;
  },

  async save(key: string, value: unknown): Promise<void> {
    const db = await sqlite();
    await db.execute(
      "INSERT INTO kv (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, JSON.stringify(value)],
    );
  },

  async flush(key: string, value: unknown): Promise<void> {
    await this.save(key, value);
  },

  async saveBlob(key: string, blob: Blob): Promise<void> {
    const { mkdir, exists, writeFile } = await import("@tauri-apps/plugin-fs");
    const dir = await blobDirectory();
    if (!(await exists(dir))) await mkdir(dir, { recursive: true });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    await writeFile(await blobPath(key), bytes);
  },

  async loadBlob(key: string): Promise<Blob | null> {
    const { exists, readFile } = await import("@tauri-apps/plugin-fs");
    const path = await blobPath(key);
    if (!(await exists(path))) return null;
    const bytes = await readFile(path);
    return new Blob([bytes]);
  },

  async removeBlob(key: string): Promise<void> {
    const { exists, remove } = await import("@tauri-apps/plugin-fs");
    const path = await blobPath(key);
    if (await exists(path)) await remove(path);
  },
};

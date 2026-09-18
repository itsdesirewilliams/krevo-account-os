/*
 * Pure helpers for the one-time localStorage -> SQLite migration.
 * Kept dependency-free so they can be unit-tested without Tauri.
 */

/** Every persisted slice uses this prefix. */
export const KV_PREFIX = "krevo_";

export const isKvKey = (key: string): boolean => key.startsWith(KV_PREFIX);

export interface LegacyEntry {
  key: string;
  value: unknown;
}

interface LocalStorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
}

/** Collect all prefixed, JSON-parsable entries from a localStorage-like store. */
export function collectLegacyEntries(storage: LocalStorageLike): LegacyEntry[] {
  const entries: LegacyEntry[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !isKvKey(key)) continue;
    const raw = storage.getItem(key);
    if (raw == null) continue;
    try {
      entries.push({ key, value: JSON.parse(raw) as unknown });
    } catch {
      // Skip unreadable entries; they stay in localStorage for manual recovery.
    }
  }
  return entries;
}

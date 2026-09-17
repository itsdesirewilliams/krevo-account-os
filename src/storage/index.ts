/*
 * Persistence layer (abstracted).
 *
 * The application only talks to the StorageDriver interface below, never to
 * a concrete browser or OS API. During browser development the
 * BrowserStorageDriver (localStorage) is active. When packaged with Tauri the
 * TauriStorageDriver takes over transparently and stores the state as a JSON
 * file in the OS app-data directory via two Rust commands:
 *
 *     load_state() -> Option<String>          (raw JSON or null)
 *     save_state(json: String)
 *
 * Swapping drivers requires no changes anywhere else in the codebase.
 */

export interface StorageDriver {
  load(key: string): Promise<unknown>;
  save(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export const STORAGE_KEY = "krevo_state_v2";

export const isTauri = (): boolean =>
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/* ---------------- Browser (development) ---------------- */

const BrowserStorageDriver: StorageDriver = {
  async load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? null : JSON.parse(raw);
    } catch {
      return null;
    }
  },
  async save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full / unavailable - ignore */
    }
  },
  async remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/* ---------------- Tauri (desktop) ---------------- */

type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;

async function getInvoke(): Promise<InvokeFn | null> {
  try {
    const core = await import("@tauri-apps/api/core");
    return core.invoke as InvokeFn;
  } catch {
    return null;
  }
}

const TauriStorageDriver: StorageDriver = {
  async load(_key) {
    const invoke = await getInvoke();
    if (!invoke) return null;
    try {
      const raw = (await invoke("load_state")) as string | null;
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  async save(_key, value) {
    const invoke = await getInvoke();
    if (!invoke) return;
    try {
      await invoke("save_state", { json: JSON.stringify(value) });
    } catch {
      /* ignore until the Rust commands are wired up */
    }
  },
  async remove(_key) {
    const invoke = await getInvoke();
    if (!invoke) return;
    try {
      await invoke("remove_state");
    } catch {
      /* ignore */
    }
  },
};

export const storage: StorageDriver = isTauri() ? TauriStorageDriver : BrowserStorageDriver;

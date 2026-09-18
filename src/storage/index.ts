/*
 * Persistence layer (abstracted).
 *
 * Features only ever talk to the StorageDriver interface below - never to a
 * browser or OS API directly - so a desktop driver can be added behind the same
 * interface without touching feature code.
 *
 * Every failure is reported through `onStorageError` so the UI can surface it;
 * persistence never fails silently.
 */
import { loadBlob, removeBlob, saveBlob } from "./blobs";

export interface StorageDriver {
  /** Resolve to the stored value, or null when nothing has been stored yet. */
  load(key: string): Promise<unknown>;
  save(key: string, value: unknown): Promise<void>;
  /** Synchronous best-effort write, used to flush pending edits on exit. */
  flush(key: string, value: unknown): void;
  /** Binary attachment storage (IndexedDB in the browser). */
  saveBlob(key: string, blob: Blob): Promise<void>;
  loadBlob(key: string): Promise<Blob | null>;
  removeBlob(key: string): Promise<void>;
}

export const STORAGE_KEY = "krevo_state_v2";

export interface StorageError {
  message: string;
}

let errorHandler: ((error: StorageError) => void) | null = null;

/** Subscribe to persistence failures (see StorageBanner). */
export function onStorageError(handler: ((error: StorageError) => void) | null): void {
  errorHandler = handler;
}

function report(message: string, cause: unknown): void {
  console.error("[storage] " + message, cause);
  errorHandler?.({ message });
}

const BrowserStorageDriver: StorageDriver = {
  async load(key) {
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch (cause) {
      report("Could not read local storage.", cause);
      throw cause;
    }
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch (cause) {
      // Unreadable data is left untouched so it can still be recovered by hand.
      report("Stored data is unreadable and was left untouched.", cause);
      throw cause;
    }
  },

  async save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (cause) {
      report("Changes could not be saved locally.", cause);
    }
  },

  flush(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (cause) {
      report("Changes could not be saved before closing.", cause);
    }
  },

  async saveBlob(key, blob) {
    try {
      await saveBlob(key, blob);
    } catch (cause) {
      report("The file could not be saved.", cause);
      throw cause;
    }
  },

  async loadBlob(key) {
    try {
      return await loadBlob(key);
    } catch (cause) {
      report("The file could not be read.", cause);
      throw cause;
    }
  },

  async removeBlob(key) {
    try {
      await removeBlob(key);
    } catch (cause) {
      report("The file could not be deleted.", cause);
      throw cause;
    }
  },
};

export const storage: StorageDriver = BrowserStorageDriver;

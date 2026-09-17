/*
 * Shared React persistence helper for feature slices.
 * Loads once from the storage driver on mount, then autosaves (debounced)
 * on every change. Swapping the driver (browser -> Tauri SQLite) requires
 * no changes here or in features.
 */
import { useEffect, useRef, useState } from "react";
import { storage } from "../storage";

export function usePersistentState<T>(
  key: string,
  fallback: () => T,
  normalize: (raw: unknown) => T = (raw) => (raw == null ? fallback() : (raw as T)),
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    let active = true;
    void storage.load(key).then((raw) => {
      if (!active) return;
      if (raw != null) setState(normalize(raw));
      setReady(true);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => void storage.save(key, state), 250);
    return () => window.clearTimeout(t);
  }, [key, state, ready]);

    return [state, setState];
}

/** Prefix used for all feature-slice storage keys. */
export const STORAGE_PREFIX = "krevo_";

/** Load a serialized section from the storage driver. */
export async function loadSection(key: string): Promise<unknown> {
  return storage.load(key);
}

/** Persist a serialized section through the storage driver. */
export async function saveSection(key: string, value: unknown): Promise<void> {
  await storage.save(key, value);
}

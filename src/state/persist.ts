/*
 * Shared React persistence helper for feature slices.
 *
 * Loads once from the storage driver on mount, autosaves (debounced) on every
 * change, and flushes synchronously when the page is hidden or closed so the
 * last edits survive an exit.
 */
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { storage } from "../storage";
import { registerFlushHandler } from "./flush";

/** Flush the latest value to storage when the page is hidden, or on app exit. */
export function useFlushOnExit<T>(key: string, valueRef: MutableRefObject<T>): void {
  useEffect(() => {
    const flush = () => storage.flush(key, valueRef.current);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const unregister = registerFlushHandler(() => storage.save(key, valueRef.current));
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      unregister();
    };
  }, [key, valueRef]);
}

/**
 * Persisted state slice.
 * Returns the value, its setter, and `ready` (false until the initial load has
 * resolved) so views can avoid rendering a misleading empty state.
 */
export function usePersistentState<T>(
  key: string,
  fallback: () => T,
  normalize: (raw: unknown) => T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  // The value produced by `fallback()` at mount; used to detect whether the
  // state was touched before the async load resolved.
  const untouched = useRef(state);
  const latest = useRef(state);
  useEffect(() => {
    latest.current = state;
  }, [state]);
  useFlushOnExit(key, latest);

  useEffect(() => {
    let active = true;
    void storage
      .load(key)
      .then((raw) => {
        if (!active) return;
        if (raw != null) {
          // Never clobber edits made while the load was in flight.
          setState((prev) => (prev === untouched.current ? normalize(raw) : prev));
        }
        setReady(true);
      })
      .catch(() => {
        // storage.load already reported the failure; fall back to defaults.
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
    // normalize/fallback are stable per key by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const first = useRef(true);
  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => void storage.save(key, state), 250);
    return () => window.clearTimeout(t);
  }, [key, state, ready]);

  return [state, setState, ready];
}

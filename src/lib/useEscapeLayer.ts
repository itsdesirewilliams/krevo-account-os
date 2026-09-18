import { useEffect, useRef } from "react";

/*
 * Shared Escape handling for stacked overlays.
 *
 * Every modal registers as a layer; only the most recently mounted layer
 * (the topmost dialog) responds to Escape, so a confirm opened on top of a
 * feature modal closes just the confirm.
 */
const layers: symbol[] = [];

export function useEscapeLayer(onEscape: () => void): void {
  const callback = useRef(onEscape);
  useEffect(() => {
    callback.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    const id = Symbol("escape-layer");
    layers.push(id);
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (layers[layers.length - 1] !== id) return;
      callback.current();
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      const index = layers.indexOf(id);
      if (index >= 0) layers.splice(index, 1);
    };
  }, []);
}

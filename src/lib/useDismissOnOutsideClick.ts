import { useEffect, type RefObject } from "react";

/**
 * Close a popover/dropdown when a pointer goes down outside of it.
 */
export function useDismissOnOutsideClick(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void,
): void {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) close();
    };
    const timer = window.setTimeout(() => document.addEventListener("mousedown", onPointerDown), 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [ref, open, close]);
}

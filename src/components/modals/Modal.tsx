import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useUI } from "../../state/ui";
import { CloseIcon } from "../Icons";

/**
 * Base floating modal: dimmed overlay (workspace stays visible behind),
 * Escape to close, GSAP entrance animation.
 */
export function Modal({
  title,
  width = 440,
  onClose,
  children,
}: {
  title: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 10, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power2.out" },
      );
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={cardRef} className="modal" style={{ width }}>
        <div className="flex items-center justify-between mb-3">
          <div className="modal-title mb-0">{title}</div>
          <button className="icon-btn" onClick={onClose} title="Close">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Convenience hook for Escape-key dismissal inside a modal. */
export function useEscape(onClose: () => void) {
  const close = useUI().closeDialog;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);
  void onClose;
}

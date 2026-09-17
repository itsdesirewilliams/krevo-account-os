import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { CloseIcon } from "../Icons";

/**
 * Lightweight feature-local modal (dimmed overlay + animated card).
 * Used by feature modules for their own forms, independent of the
 * global accounts dialog system.
 */
export function SimpleModal({
  title,
  onClose,
  children,
  width = 420,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  width?: number;
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

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

export function FeatureEmpty({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-dim">
      <div className="text-[14px]">{message}</div>
      {action}
    </div>
  );
}

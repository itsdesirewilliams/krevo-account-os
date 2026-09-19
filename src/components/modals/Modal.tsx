import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useEscapeLayer } from "../../lib/useEscapeLayer";
import { CloseIcon } from "../Icons";

/**
 * The single modal: a focus overlay with GSAP entrance and stacked-Escape
 * handling. Used for creation, prompt and confirmation dialogs.
 */
export function Modal({
  title,
  width,
  onClose,
  children,
}: {
  title: string;
  width?: number;
  onClose: () => void;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEscapeLayer(onClose);

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 8, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.16, ease: "power2.out" },
      );
    }
  }, []);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={cardRef}
        className="modal"
        style={width ? { width } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div className="modal-title" style={{ margin: 0 }}>{title}</div>
          <button className="icon-btn" onClick={onClose} title="Close" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

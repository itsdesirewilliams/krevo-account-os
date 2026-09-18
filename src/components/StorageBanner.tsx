import { useEffect, useState } from "react";
import { onStorageError } from "../storage";

/**
 * Surfaces persistence failures instead of letting them disappear.
 * Sits above the workspace; dismissible.
 */
export function StorageBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    onStorageError((error) => setMessage(error.message));
    return () => onStorageError(null);
  }, []);

  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-4 py-2 text-[12.5px] shrink-0"
      style={{ background: "rgba(255, 107, 107, 0.14)", color: "#ff8585", borderBottom: "1px solid #6e1c1c" }}
    >
      <span className="flex-1">{message}</span>
      <button className="btn btn-ghost !py-0.5 !px-2" onClick={() => setMessage(null)}>
        Dismiss
      </button>
    </div>
  );
}

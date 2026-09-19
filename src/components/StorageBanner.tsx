import { useEffect, useState } from "react";
import { onStorageError } from "../storage";

/** Surfaces persistence failures; never fails silently. */
export function StorageBanner() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    onStorageError((error) => setMessage(error.message));
    return () => onStorageError(null);
  }, []);

  if (!message) return null;

  return (
    <div role="alert" className="notice">
      <span className="flex-1">{message}</span>
      <button className="btn btn-quiet" style={{ height: 22, padding: "0 8px", fontSize: 11.5 }} onClick={() => setMessage(null)}>
        Dismiss
      </button>
    </div>
  );
}

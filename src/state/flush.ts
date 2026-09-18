/*
 * Exit flush registry. Every persistent slice registers a handler that writes
 * its latest value through the storage driver. On desktop, the Tauri window
 * close handler awaits `flushAll()` before allowing the app to exit.
 */
type FlushHandler = () => void | Promise<void>;

const handlers = new Set<FlushHandler>();

export function registerFlushHandler(handler: FlushHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export async function flushAll(): Promise<void> {
  await Promise.all([...handlers].map((handler) => handler()));
}

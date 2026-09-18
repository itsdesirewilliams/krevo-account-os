/*
 * Blob storage: IndexedDB in the browser, with an in-memory fallback when
 * IndexedDB is unavailable (tests/SSR). Large binaries never enter app state.
 */
const DB_NAME = "krevo_blobs";
const STORE = "blobs";

const hasIndexedDb = typeof indexedDB !== "undefined";
const memory = new Map<string, Blob>();

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function database(): Promise<IDBDatabase> {
  dbPromise ??= openDb();
  return dbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await database();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
  });
}

export async function saveBlob(key: string, blob: Blob): Promise<void> {
  if (!hasIndexedDb) {
    memory.set(key, blob);
    return;
  }
  await withStore<IDBValidKey>("readwrite", (store) => store.put(blob, key));
}

export async function loadBlob(key: string): Promise<Blob | null> {
  if (!hasIndexedDb) return memory.get(key) ?? null;
  const value = await withStore<unknown>("readonly", (store) => store.get(key));
  return value instanceof Blob ? value : null;
}

export async function removeBlob(key: string): Promise<void> {
  if (!hasIndexedDb) {
    memory.delete(key);
    return;
  }
  await withStore<undefined>("readwrite", (store) => store.delete(key));
}

import type { StateStorage } from "zustand/middleware";

const DB_NAME = "yomirra-store";
const STORE_NAME = "keyval";
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function isIndexedDBSupported(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function getIDB(): Promise<IDBDatabase> {
  if (!isIndexedDBSupported()) {
    return Promise.reject(new Error("IndexedDB is not supported or running on server"));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        dbPromise = null;
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn("IndexedDB upgrade blocked by another tab");
      };
    });
  }

  return dbPromise;
}

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;

    if (isIndexedDBSupported()) {
      try {
        const db = await getIDB();
        const value = await new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(name);

          req.onsuccess = () => {
            resolve(req.result !== undefined ? (req.result as string) : null);
          };
          req.onerror = () => reject(req.error);
        });

        if (value !== null) {
          return value;
        }

        // Check legacy localStorage for migration to IDB
        try {
          const legacyValue = window.localStorage.getItem(name);
          if (legacyValue !== null) {
            // Write to IDB
            await new Promise<void>((resolve, reject) => {
              const tx = db.transaction(STORE_NAME, "readwrite");
              const store = tx.objectStore(STORE_NAME);
              const req = store.put(legacyValue, name);
              req.onsuccess = () => resolve();
              req.onerror = () => reject(req.error);
            });
            // Reclaim localStorage quota
            window.localStorage.removeItem(name);
            return legacyValue;
          }
        } catch {
          // localStorage access failed
        }

        return null;
      } catch (e) {
        console.warn(`[idbStorage] Failed to read "${name}" from IndexedDB:`, e);
      }
    }

    // Fallback to localStorage if IDB is not supported or failed
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;

    if (isIndexedDBSupported()) {
      try {
        const db = await getIDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(value, name);

          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });

        // Cleanup localStorage legacy key since data is safely in IDB
        try {
          window.localStorage.removeItem(name);
        } catch {
          // ignore
        }
        return;
      } catch (e) {
        console.warn(`[idbStorage] Failed to write "${name}" to IndexedDB:`, e);
      }
    }

    // Fallback to localStorage
    try {
      window.localStorage.setItem(name, value);
    } catch (err) {
      console.error(`[idbStorage] LocalStorage write failed for "${name}":`, err);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;

    if (isIndexedDBSupported()) {
      try {
        const db = await getIDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          const store = tx.objectStore(STORE_NAME);
          const req = store.delete(name);

          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (e) {
        console.warn(`[idbStorage] Failed to delete "${name}" from IndexedDB:`, e);
      }
    }

    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

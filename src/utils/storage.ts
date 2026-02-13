import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Custom Zustand storage adapter that uses localStorage by default
 * and falls back to IndexedDB when a QuotaExceededError is thrown.
 */
export const fallbackStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const local = localStorage.getItem(name);
    if (local !== null) return local;
    return (await get<string>(name)) ?? null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        await set(name, value);
      } else {
        throw e;
      }
    }
  },

  removeItem: async (name: string): Promise<void> => {
    localStorage.removeItem(name);
    await del(name);
  },
};

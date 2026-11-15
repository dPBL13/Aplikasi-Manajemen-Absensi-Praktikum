import { seedClasses, seedPermits, seedSessions } from '@/data/seed';
import type { AppData } from '@/types/domain';

/**
 * State in-memory + mekanisme subscribe (meniru `onSnapshot` Firestore).
 *
 * Ini BUKAN tempat logika bisnis. Aksi ada di `src/services/mock/index.ts`.
 * UI membaca state lewat `useAppData()` (src/services/index.ts).
 */

let state: AppData = {
  classes: seedClasses,
  sessions: seedSessions,
  permits: seedPermits,
};

const listeners = new Set<() => void>();

/** Stabil: dipakai useSyncExternalStore, jangan diganti dengan objek baru tiap render. */
export function getSnapshot(): AppData {
  return state;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Terapkan state baru lalu beri tahu seluruh subscriber.
 * Semua layar yang memakai `useAppData()` otomatis re-render (FR-15).
 */
export function commit(next: AppData) {
  state = next;
  listeners.forEach((listener) => listener());
}

let sequence = 0;

export function createId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}${sequence}`;
}

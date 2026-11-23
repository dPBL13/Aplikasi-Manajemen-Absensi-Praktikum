import { useSyncExternalStore } from 'react';

const TICK_MS = 60_000;

let now = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, TICK_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot(): number {
  return now;
}

/**
 * Waktu "sekarang" yang stabil antar-render dan diperbarui tiap menit.
 * Dipakai untuk mengelompokkan sesi yang sudah berlalu tanpa memanggil
 * `Date.now()` langsung di dalam render (React Compiler purity rule).
 */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

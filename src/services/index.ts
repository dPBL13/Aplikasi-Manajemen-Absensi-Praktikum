import { useSyncExternalStore } from 'react';

import { mockDataService } from './mock';
import type { DataService } from './types';

/**
 * TITIK GANTI BACKEND — satu-satunya tempat implementasi data dipilih.
 *
 * Sekarang: mock (in-memory, realtime via subscribe).
 * Nanti   : `export const dataService = firestoreDataService;`
 *           Adapter baru cukup mengimplementasikan `DataService`
 *           (lihat src/services/types.ts dan panduan di AI_CONTEXT.md).
 */
export const dataService: DataService = mockDataService;

/**
 * Berlangganan seluruh state aplikasi. Setiap mutasi memicu re-render,
 * sehingga perubahan dari satu peran langsung terlihat di peran lain (FR-15).
 *
 * Implementasi apa pun (mock/Firestore) wajib menyediakan `getData` stabil
 * dan `subscribeData` agar hook ini tetap bekerja tanpa perubahan.
 */
export function useAppData() {
  return useSyncExternalStore(
    (listener) => dataService.subscribeData(listener),
    () => dataService.getData(),
    () => dataService.getData(),
  );
}

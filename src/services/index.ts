import { useSyncExternalStore } from 'react';

import { firestoreDataService } from './firestore-service';
import { mockDataService } from './mock';
import type { DataService } from './types';

/**
 * TITIK GANTI BACKEND — satu-satunya tempat implementasi data dipilih.
 *
 * Menggunakan firestoreDataService untuk Cloud Firestore real-time & integrasi Gemini AI.
 */
export const dataService: DataService = firestoreDataService;
export { mockDataService, firestoreDataService };



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

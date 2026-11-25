import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';
import { useSyncExternalStore } from 'react';

import { seedLaboratories } from '@/data/seed-labs';
import type { Laboratory } from '@/types/domain';
import { firebaseAuth, firestore } from './firebase/config';
import { firestoreDataService } from './firestore-service';
import {
  firstError,
  normalizeLaboratoryInput,
  sortLaboratories,
  validateLaboratoryInput,
  type LaboratoryInput,
  type LaboratoryService,
} from './laboratory-contract';
import { createMockLaboratoryService } from './mock/laboratory-mock';
import type { MutationResult } from './types';

export * from './laboratory-contract';

/**
 * LABORATORY SERVICE (JH-01) — koleksi Firestore `laboratories`.
 *
 * Mengikuti pola `firestore-service.ts`: cache referensi-stabil, `onSnapshot`
 * untuk realtime, fallback ke data contoh bila pembacaan ditolak, dan setiap
 * mutasi mengembalikan `MutationResult` berpesan Indonesia.
 *
 * Layar membaca lewat `useLaboratories()` / `useLaboratory(id)` dan menulis
 * lewat `laboratoryService`. Jangan impor `./mock/*` atau `@/data/seed-labs`
 * dari layar.
 */

const COLLECTION = 'laboratories';
const FAIL = (reason: string): MutationResult => ({ ok: false, reason });

function requireAuth(): MutationResult | null {
  if (!firebaseAuth.currentUser) {
    return FAIL('Anda belum masuk. Silakan login terlebih dahulu agar perubahan tersimpan ke server.');
  }
  return null;
}

/** Firestore menolak `undefined`; dokumen memakai `null` untuk field opsional. */
function fromDoc(id: string, data: Record<string, unknown>): Laboratory {
  return {
    id,
    name: String(data.name ?? ''),
    code: String(data.code ?? ''),
    building: String(data.building ?? ''),
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    radius: Number(data.radius),
    capacity: typeof data.capacity === 'number' ? data.capacity : undefined,
    description: typeof data.description === 'string' ? data.description : undefined,
    updatedAt: String(data.updatedAt ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
  };
}

let cache: Laboratory[] = [];
const listeners = new Set<() => void>();
let unsubscribeSnapshot: (() => void) | null = null;
let hasLoaded = false;
let usingSeedFallback = false;

function emit(next: Laboratory[]) {
  cache = sortLaboratories(next);
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (error) {
      console.warn('[laboratory] listener error:', error);
    }
  });
}

function loadSeedFallback(reason: unknown) {
  if (usingSeedFallback || hasLoaded) return;
  usingSeedFallback = true;
  console.warn('[laboratory] Gagal membaca Firestore. Memakai data contoh lokal.', reason);
  emit(seedLaboratories);
}

/** Seed sekali bila koleksi kosong dan pengguna sudah login (sama dengan pola classes). */
async function seedIfEmpty() {
  if (!firebaseAuth.currentUser) return;
  try {
    const snap = await getDocs(collection(firestore, COLLECTION));
    if (!snap.empty) return;
    const batch = writeBatch(firestore);
    seedLaboratories.forEach((lab) => {
      const { id, capacity, description, ...rest } = lab;
      batch.set(doc(firestore, COLLECTION, id), {
        ...rest,
        capacity: capacity ?? null,
        description: description ?? null,
      });
    });
    await batch.commit();
  } catch (error) {
    console.warn('[laboratory] Gagal seeding laboratorium:', error);
  }
}

function startSync() {
  if (unsubscribeSnapshot) return;

  void seedIfEmpty();

  unsubscribeSnapshot = onSnapshot(
    collection(firestore, COLLECTION),
    (snap) => {
      hasLoaded = true;
      usingSeedFallback = false;
      emit(snap.docs.map((d) => fromDoc(d.id, d.data() as Record<string, unknown>)));
    },
    (error) => loadSeedFallback(error),
  );
}

function stopSyncIfIdle() {
  if (listeners.size === 0 && unsubscribeSnapshot) {
    unsubscribeSnapshot();
    unsubscribeSnapshot = null;
  }
}

function generateId() {
  return `lab-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function isCodeTaken(code: string, exceptId?: string) {
  const normalized = code.trim().toUpperCase();
  return cache.some((lab) => lab.id !== exceptId && lab.code.toUpperCase() === normalized);
}

export const firestoreLaboratoryService: LaboratoryService = {
  getLaboratories: () => cache,
  getLaboratoryById: (id) => cache.find((lab) => lab.id === id),

  subscribe(listener) {
    startSync();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      stopSyncIfIdle();
    };
  },

  async createLaboratory(input: LaboratoryInput) {
    const authError = requireAuth();
    if (authError) return authError;

    const error = firstError(validateLaboratoryInput(input));
    if (error) return FAIL(error);
    if (isCodeTaken(input.code)) return FAIL('Kode laboratorium sudah dipakai.');

    const id = generateId();
    try {
      await setDoc(doc(firestore, COLLECTION, id), {
        ...normalizeLaboratoryInput(input),
        updatedAt: new Date().toISOString(),
        updatedBy: firebaseAuth.currentUser?.uid ?? 'unknown',
      });
      return { ok: true, id };
    } catch (err) {
      return FAIL(err instanceof Error ? err.message : 'Gagal menyimpan laboratorium.');
    }
  },

  async updateLaboratory(id, input) {
    const authError = requireAuth();
    if (authError) return authError;

    if (!cache.some((lab) => lab.id === id)) return FAIL('Laboratorium tidak ditemukan.');
    const error = firstError(validateLaboratoryInput(input));
    if (error) return FAIL(error);
    if (isCodeTaken(input.code, id)) return FAIL('Kode laboratorium sudah dipakai.');

    try {
      await updateDoc(doc(firestore, COLLECTION, id), {
        ...normalizeLaboratoryInput(input),
        updatedAt: new Date().toISOString(),
        updatedBy: firebaseAuth.currentUser?.uid ?? 'unknown',
      });
      return { ok: true };
    } catch (err) {
      return FAIL(err instanceof Error ? err.message : 'Gagal memperbarui laboratorium.');
    }
  },

  async deleteLaboratory(id) {
    const authError = requireAuth();
    if (authError) return authError;

    if (!cache.some((lab) => lab.id === id)) return FAIL('Laboratorium tidak ditemukan.');

    // Baca-saja terhadap sesi: tidak menyentuh presensi/attendance.
    const inUse = firestoreDataService
      .getData()
      .sessions.some((session) => session.laboratoryId === id && session.status !== 'selesai');
    if (inUse) return FAIL('Laboratorium masih dipakai sesi yang belum selesai.');

    try {
      await deleteDoc(doc(firestore, COLLECTION, id));
      return { ok: true };
    } catch (err) {
      return FAIL(err instanceof Error ? err.message : 'Gagal menghapus laboratorium.');
    }
  },
};

/** TITIK GANTI — sama seperti `dataService`. Mock tersedia untuk demo offline/tes. */
export const laboratoryService: LaboratoryService = firestoreLaboratoryService;
export const mockLaboratoryService: LaboratoryService = createMockLaboratoryService({
  seed: seedLaboratories,
});

/** Semua laboratorium (realtime). Referensi array stabil sampai ada perubahan. */
export function useLaboratories(): Laboratory[] {
  return useSyncExternalStore(
    (listener) => laboratoryService.subscribe(listener),
    () => laboratoryService.getLaboratories(),
    () => laboratoryService.getLaboratories(),
  );
}

/** Satu laboratorium menurut id; `undefined` bila belum termuat/tidak ada. */
export function useLaboratory(id: string | undefined): Laboratory | undefined {
  const labs = useLaboratories();
  return id ? labs.find((lab) => lab.id === id) : undefined;
}

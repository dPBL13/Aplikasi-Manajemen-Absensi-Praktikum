import type { AppData, PracticumClass } from '@/types/domain';

/**
 * KONTRAK DATA LAYER — dibaca oleh seluruh UI.
 *
 * UI hanya boleh berbicara dengan `dataService` (lihat src/services/index.ts).
 * Implementasi saat ini: mock (`src/services/mock`).
 * Implementasi berikutnya: Firestore (modul Backend). Selama bentuk kontrak ini
 * tidak berubah, tidak ada layar yang perlu diedit saat backend dipasang.
 */

/** Hasil operasi tulis. `reason` sudah berupa teks siap tampil di UI. */
export type MutationResult = { ok: true } | { ok: false; reason: string };

/** Error validasi per-field untuk form. Kunci = nama field input. */
export type FieldErrors = Record<string, string>;

export interface ClassInput {
  courseName: string;
  code: string;
  classGroup: string;
  room: string;
  description?: string;
}

export interface ParticipantInput {
  name: string;
  nim: string;
}

export interface SessionInput {
  classId: string;
  dayLabel: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  /** Bila kosong, memakai `PracticumClass.room`. */
  room?: string;
}

export interface PermitDecisionInput {
  status: 'diterima' | 'ditolak';
  note?: string;
  decidedBy: string;
}

export interface SubmitPermitInput {
  sessionId: string;
  reason: string;
  participantId?: string;
  participantName?: string;
  nim?: string;
}

export interface DataService {
  /**
   * Snapshot state saat ini. Harus stabil (objek sama) sampai ada mutasi,
   * karena dipakai `useSyncExternalStore`.
   */
  getData(): AppData;
  /** Berlangganan perubahan state (mock: emit manual, Firestore: onSnapshot). */
  subscribeData(listener: () => void): () => void;

  // FR-05 — kelas praktikum
  createClass(input: ClassInput): Promise<MutationResult & { id?: string }>;
  updateClass(id: string, input: ClassInput): Promise<MutationResult>;
  deleteClass(id: string): Promise<MutationResult>;

  // FR-06 — peserta kelas
  addParticipant(classId: string, input: ParticipantInput): Promise<MutationResult>;
  removeParticipant(classId: string, participantId: string): Promise<MutationResult>;

  // FR-07 / FR-08 — jadwal & sesi
  createSession(input: SessionInput): Promise<MutationResult & { id?: string }>;
  updateSession(id: string, input: SessionInput): Promise<MutationResult>;
  deleteSession(id: string): Promise<MutationResult>;
  openSession(id: string): Promise<MutationResult>;
  closeSession(id: string, note?: string): Promise<MutationResult>;

  // FR-10 / FR-11 — presensi praktikan
  checkIn(sessionId: string, participantId: string): Promise<MutationResult>;

  // FR-28 (Sprint 3, HF-03) — presensi tervalidasi radius geofencing & metadata audit
  checkInWithLocation?(
    input: import('./attendance-location').CheckInLocationInput,
  ): Promise<import('./attendance-location').CheckInLocationResult>;

  // FR-16 s/d FR-18 — pengajuan izin praktikan & klasifikasi AI
  submitPermit?(input: SubmitPermitInput): Promise<MutationResult & { permit?: import('@/types/domain').Permit }>;

  // FR-20 — keputusan izin
  decidePermit(id: string, decision: PermitDecisionInput): Promise<MutationResult>;
}


/** Helper untuk layar: kelas + jumlah peserta tanpa perlu mengurangi manual. */
export function countParticipants(practicumClass: PracticumClass): number {
  return practicumClass.participants.length;
}

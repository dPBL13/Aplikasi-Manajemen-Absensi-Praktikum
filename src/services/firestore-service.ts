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

import { CURRENT_ASPRAK_NAME, CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { seedClasses, seedPermits, seedSessions } from '@/data/seed';
import type {
  AppData,
  Participant,
  Permit,
  PracticumClass,
  PracticumSession,
  SessionParticipant,
} from '@/types/domain';
import { formatClock } from '@/utils/format-clock';
import { firestore } from './firebase/config';
import { classifyLeaveReason } from './gemini-service';
import type {
  ClassInput,
  DataService,
  MutationResult,
  ParticipantInput,
  PermitDecisionInput,
  SessionInput,
  SubmitPermitInput,
} from './types';
import {
  hasErrors,
  validateClassInput,
  validateParticipantInput,
  validateSessionInput,
} from './validation';

const FAIL = (reason: string): MutationResult => ({ ok: false, reason });
const SUCCESS: MutationResult = { ok: true };

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// In-memory cache agar `getData()` selalu stabil untuk useSyncExternalStore
let cachedData: AppData = {
  classes: [],
  sessions: [],
  permits: [],
};

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('[firestore-service] Error notifying listener:', e);
    }
  });
}

let isSubscribed = false;
let unsubscribers: (() => void)[] = [];

/**
 * Menginisialisasi listener Firestore untuk koleksi classes, sessions, dan permits.
 */
function initFirestoreSync() {
  if (isSubscribed) return;
  isSubscribed = true;

  const classesRef = collection(firestore, 'classes');
  const sessionsRef = collection(firestore, 'sessions');
  const permitsRef = collection(firestore, 'permits');

  // Cek apakah data awal Firestore masih kosong, jika ya isi dengan SEED_DATA
  getDocs(classesRef).then(async (snap) => {
    if (snap.empty) {
      console.log('[firestore-service] Firestore masih kosong, memuat data awal (seeding)...');
      try {
        const batch = writeBatch(firestore);
        seedClasses.forEach((cls: PracticumClass) => {
          batch.set(doc(firestore, 'classes', cls.id), cls);
        });
        seedSessions.forEach((ses: PracticumSession) => {
          batch.set(doc(firestore, 'sessions', ses.id), ses);
        });
        seedPermits.forEach((per: Permit) => {
          batch.set(doc(firestore, 'permits', per.id), per);
        });
        await batch.commit();
      } catch (err) {
        console.warn('[firestore-service] Gagal seeding data awal:', err);
      }
    }
  });

  const unsubClasses = onSnapshot(
    classesRef,
    (snap) => {
      const classes = snap.docs.map((d) => d.data() as PracticumClass);
      cachedData = { ...cachedData, classes };
      notifyListeners();
    },
    (err) => console.warn('[firestore-service] Listener classes error:', err)
  );

  const unsubSessions = onSnapshot(
    sessionsRef,
    (snap) => {
      const sessions = snap.docs.map((d) => d.data() as PracticumSession);
      cachedData = { ...cachedData, sessions };
      notifyListeners();
    },
    (err) => console.warn('[firestore-service] Listener sessions error:', err)
  );

  const unsubPermits = onSnapshot(
    permitsRef,
    (snap) => {
      const permits = snap.docs.map((d) => d.data() as Permit);
      cachedData = { ...cachedData, permits };
      notifyListeners();
    },
    (err) => console.warn('[firestore-service] Listener permits error:', err)
  );

  unsubscribers = [unsubClasses, unsubSessions, unsubPermits];
}

export const firestoreDataService: DataService = {
  getData(): AppData {
    return cachedData;
  },

  subscribeData(listener: () => void): () => void {
    initFirestoreSync();
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        unsubscribers.forEach((unsub) => unsub());
        unsubscribers = [];
        isSubscribed = false;
      }
    };
  },

  // FR-05 — kelas praktikum
  async createClass(input: ClassInput): Promise<MutationResult & { id?: string }> {
    const errors = validateClassInput(input);
    if (hasErrors(errors)) {
      return FAIL(Object.values(errors)[0]);
    }

    const id = generateId('cls');
    const newClass: PracticumClass = {
      id,
      courseName: input.courseName.trim(),
      code: input.code.trim().toUpperCase(),
      classGroup: input.classGroup.trim(),
      room: input.room.trim(),
      asprakName: CURRENT_ASPRAK_NAME,
      description: input.description?.trim() || undefined,
      createdAt: new Date().toISOString(),
      participants: [],
    };

    try {
      await setDoc(doc(firestore, 'classes', id), newClass);
      return { ok: true, id };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal membuat kelas.');
    }
  },

  async updateClass(id: string, input: ClassInput): Promise<MutationResult> {
    const existing = cachedData.classes.find((c) => c.id === id);
    if (!existing) return FAIL('Kelas tidak ditemukan.');

    const errors = validateClassInput(input);
    if (hasErrors(errors)) return FAIL(Object.values(errors)[0]);

    try {
      const updatedClass: Partial<PracticumClass> = {
        courseName: input.courseName.trim(),
        code: input.code.trim().toUpperCase(),
        classGroup: input.classGroup.trim(),
        room: input.room.trim(),
        description: input.description?.trim() || undefined,
      };

      await updateDoc(doc(firestore, 'classes', id), updatedClass);

      // Perbarui denormalisasi pada sesi terkait
      const batch = writeBatch(firestore);
      const relatedSessions = cachedData.sessions.filter((s) => s.classId === id);
      relatedSessions.forEach((s) => {
        batch.update(doc(firestore, 'sessions', s.id), {
          courseName: input.courseName.trim(),
          classGroup: input.classGroup.trim(),
        });
      });
      await batch.commit();

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal memperbarui kelas.');
    }
  },

  async deleteClass(id: string): Promise<MutationResult> {
    const existing = cachedData.classes.find((c) => c.id === id);
    if (!existing) return FAIL('Kelas tidak ditemukan.');

    try {
      const batch = writeBatch(firestore);
      batch.delete(doc(firestore, 'classes', id));

      // Hapus sesi terkait
      const relatedSessions = cachedData.sessions.filter((s) => s.classId === id);
      relatedSessions.forEach((s) => batch.delete(doc(firestore, 'sessions', s.id)));

      // Hapus izin terkait
      const relatedPermits = cachedData.permits.filter((p) => p.classId === id);
      relatedPermits.forEach((p) => batch.delete(doc(firestore, 'permits', p.id)));

      await batch.commit();
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menghapus kelas.');
    }
  },

  // FR-06 — peserta kelas
  async addParticipant(classId: string, input: ParticipantInput): Promise<MutationResult> {
    const targetClass = cachedData.classes.find((c) => c.id === classId);
    if (!targetClass) return FAIL('Kelas tidak ditemukan.');

    const errors = validateParticipantInput(input);
    if (hasErrors(errors)) return FAIL(Object.values(errors)[0]);

    const cleanNim = input.nim.trim();
    if (targetClass.participants.some((p) => p.nim === cleanNim)) {
      return FAIL('Praktikan dengan NIM tersebut sudah terdaftar di kelas ini.');
    }

    const newParticipant: Participant = {
      id: generateId('par'),
      classId,
      name: input.name.trim(),
      nim: cleanNim,
    };

    try {
      const updatedParticipants = [...targetClass.participants, newParticipant];
      await updateDoc(doc(firestore, 'classes', classId), {
        participants: updatedParticipants,
      });

      // Tambahkan peserta ke sesi yang belum selesai
      const batch = writeBatch(firestore);
      const openOrUpcomingSessions = cachedData.sessions.filter(
        (s) => s.classId === classId && s.status !== 'selesai'
      );
      openOrUpcomingSessions.forEach((s) => {
        batch.update(doc(firestore, 'sessions', s.id), {
          participants: [...s.participants, { ...newParticipant }],
        });
      });
      await batch.commit();

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menambahkan peserta.');
    }
  },

  async removeParticipant(classId: string, participantId: string): Promise<MutationResult> {
    const targetClass = cachedData.classes.find((c) => c.id === classId);
    if (!targetClass) return FAIL('Kelas tidak ditemukan.');

    try {
      const updatedParticipants = targetClass.participants.filter((p) => p.id !== participantId);
      await updateDoc(doc(firestore, 'classes', classId), {
        participants: updatedParticipants,
      });

      // Hapus dari sesi yang belum selesai
      const batch = writeBatch(firestore);
      const activeSessions = cachedData.sessions.filter(
        (s) => s.classId === classId && s.status !== 'selesai'
      );
      activeSessions.forEach((s) => {
        batch.update(doc(firestore, 'sessions', s.id), {
          participants: s.participants.filter((p) => p.id !== participantId),
        });
      });
      await batch.commit();

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menghapus peserta.');
    }
  },

  // FR-07 / FR-08 — jadwal & sesi
  async createSession(input: SessionInput): Promise<MutationResult & { id?: string }> {
    const targetClass = cachedData.classes.find((c) => c.id === input.classId);
    if (!targetClass) return FAIL('Kelas tidak ditemukan.');

    const errors = validateSessionInput(input);
    if (hasErrors(errors)) return FAIL(Object.values(errors)[0]);

    const id = generateId('ses');
    const participants: SessionParticipant[] = targetClass.participants.map((p) => ({
      ...p,
    }));

    const newSession: PracticumSession = {
      id,
      classId: targetClass.id,
      courseName: targetClass.courseName,
      classGroup: targetClass.classGroup,
      room: input.room?.trim() || targetClass.room,
      dayLabel: input.dayLabel.trim(),
      dateLabel: input.dateLabel.trim(),
      startTime: input.startTime.trim(),
      endTime: input.endTime.trim(),
      asprakName: targetClass.asprakName,
      status: 'belum-dibuka',
      participants,
    };

    try {
      await setDoc(doc(firestore, 'sessions', id), newSession);
      return { ok: true, id };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal membuat sesi.');
    }
  },

  async updateSession(id: string, input: SessionInput): Promise<MutationResult> {
    const existing = cachedData.sessions.find((s) => s.id === id);
    if (!existing) return FAIL('Sesi tidak ditemukan.');

    if (existing.status === 'selesai') {
      return FAIL('Sesi yang sudah selesai tidak dapat diubah.');
    }

    const errors = validateSessionInput(input);
    if (hasErrors(errors)) return FAIL(Object.values(errors)[0]);

    try {
      const updated: Partial<PracticumSession> = {
        dayLabel: input.dayLabel.trim(),
        dateLabel: input.dateLabel.trim(),
        startTime: input.startTime.trim(),
        endTime: input.endTime.trim(),
        room: input.room?.trim() || existing.room,
      };

      await updateDoc(doc(firestore, 'sessions', id), updated);
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal memperbarui sesi.');
    }
  },

  async deleteSession(id: string): Promise<MutationResult> {
    const existing = cachedData.sessions.find((s) => s.id === id);
    if (!existing) return FAIL('Sesi tidak ditemukan.');

    if (existing.status === 'berlangsung') {
      return FAIL('Sesi yang sedang berlangsung tidak dapat dihapus. Tutup sesi terlebih dahulu.');
    }

    try {
      await deleteDoc(doc(firestore, 'sessions', id));
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menghapus sesi.');
    }
  },

  async openSession(id: string): Promise<MutationResult> {
    const existing = cachedData.sessions.find((s) => s.id === id);
    if (!existing) return FAIL('Sesi tidak ditemukan.');

    if (existing.status === 'berlangsung') return FAIL('Sesi sudah dalam status berlangsung.');
    if (existing.status === 'selesai') return FAIL('Sesi yang sudah selesai tidak dapat dibuka kembali.');

    try {
      await updateDoc(doc(firestore, 'sessions', id), {
        status: 'berlangsung',
        openedAt: formatClock(),
      });
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal membuka sesi.');
    }
  },

  async closeSession(id: string, note?: string): Promise<MutationResult> {
    const existing = cachedData.sessions.find((s) => s.id === id);
    if (!existing) return FAIL('Sesi tidak ditemukan.');

    if (existing.status === 'belum-dibuka') return FAIL('Sesi belum pernah dibuka.');
    if (existing.status === 'selesai') return FAIL('Sesi sudah selesai.');

    try {
      await updateDoc(doc(firestore, 'sessions', id), {
        status: 'selesai',
        closedAt: formatClock(),
        closingNote: note?.trim() || undefined,
      });
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menutup sesi.');
    }
  },

  // FR-10 / FR-11 — presensi praktikan
  async checkIn(sessionId: string, participantId: string): Promise<MutationResult> {
    const existing = cachedData.sessions.find((s) => s.id === sessionId);
    if (!existing) return FAIL('Sesi tidak ditemukan.');

    if (existing.status === 'belum-dibuka') {
      return FAIL('Sesi belum dibuka oleh asisten praktikum.');
    }
    if (existing.status === 'selesai') {
      return FAIL('Sesi sudah ditutup. Presensi tidak lagi diterima.');
    }

    const participantIndex = existing.participants.findIndex((p) => p.id === participantId);
    if (participantIndex === -1) {
      return FAIL('Anda tidak terdaftar sebagai peserta pada sesi ini.');
    }

    const participant = existing.participants[participantIndex];
    if (participant.checkInAt) {
      return FAIL(`Anda sudah tercatat hadir pada pukul ${participant.checkInAt}.`);
    }

    try {
      const updatedParticipants = [...existing.participants];
      updatedParticipants[participantIndex] = {
        ...participant,
        checkInAt: formatClock(),
      };

      await updateDoc(doc(firestore, 'sessions', sessionId), {
        participants: updatedParticipants,
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal mencatat presensi.');
    }
  },

  // FR-16 s/d FR-18 — pengajuan izin praktikan & klasifikasi Gemini AI
  async submitPermit(
    input: SubmitPermitInput
  ): Promise<MutationResult & { permit?: Permit }> {
    const session = cachedData.sessions.find((s) => s.id === input.sessionId);
    if (!session) return FAIL('Sesi praktikum tidak ditemukan.');

    const reason = input.reason.trim();
    if (!reason || reason.length < 5) {
      return FAIL('Alasan izin terlalu singkat. Harap jelaskan minimal 5 karakter.');
    }

    // Identifikasi mahasiswa yang mengajukan
    const participantId = input.participantId || CURRENT_PRACTIKAN_ID;
    const participant =
      session.participants.find((p) => p.id === participantId) ||
      session.participants[0];

    const participantName = input.participantName || participant?.name || 'Praktikan';
    const nim = input.nim || participant?.nim || '24060124120000';

    try {
      // Panggil Gemini AI untuk klasifikasi alasan (FR-17)
      const aiResult = await classifyLeaveReason(reason);

      const id = generateId('permit');
      const newPermit: Permit = {
        id,
        sessionId: session.id,
        classId: session.classId,
        participantId,
        participantName,
        nim,
        courseName: session.courseName,
        reason,
        submittedAt: new Date().toISOString(),
        aiCategory: aiResult.category,
        aiConfidence: aiResult.confidence,
        aiModel: aiResult.model,
        status: 'menunggu',
      };

      // Simpan hasil klasifikasi AI ke Cloud Firestore (FR-18)
      await setDoc(doc(firestore, 'permits', id), newPermit);

      return { ok: true, permit: newPermit };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal memproses pengajuan izin.');
    }
  },

  // FR-20 — keputusan izin oleh Asprak
  async decidePermit(id: string, decision: PermitDecisionInput): Promise<MutationResult> {
    const existing = cachedData.permits.find((p) => p.id === id);
    if (!existing) return FAIL('Pengajuan izin tidak ditemukan.');

    try {
      const updated: Partial<Permit> = {
        status: decision.status,
        decidedAt: new Date().toISOString(),
        decidedBy: decision.decidedBy,
        decisionNote: decision.note?.trim() || undefined,
      };

      await updateDoc(doc(firestore, 'permits', id), updated);
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menyimpan keputusan izin.');
    }
  },
};

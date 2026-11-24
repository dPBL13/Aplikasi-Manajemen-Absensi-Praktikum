import { onAuthStateChanged } from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from '@react-native-firebase/firestore';

import { CURRENT_ASPRAK_NAME, CURRENT_PRACTIKAN_ID } from '@/data/current-user';
import { seedClasses, seedPermits, seedSessions } from '@/data/seed';
import type {
  AppData,
  AttendanceAuditRecord,
  Participant,
  Permit,
  PracticumClass,
  PracticumSession,
  SessionParticipant,
} from '@/types/domain';
import { formatClock } from '@/utils/format-clock';
import {
  type CheckInLocationInput,
  type CheckInLocationResult,
  validateCheckInLocation,
} from './attendance-location';
import { getFirebaseAuth, getFirebaseFirestore } from './firebase/config';
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

/**
 * Firestore menolak semua penulisan tanpa autentikasi. Tanpa guard ini,
 * SDK tetap menampilkan perubahan dari cache lokal seolah-olah berhasil,
 * padahal dokumen tidak pernah sampai ke server. Kembalikan pesan yang jelas
 * daripada memberi ilusi "tersimpan".
 */
function requireAuth(): MutationResult | null {
  if (!getFirebaseAuth().currentUser) {
    return FAIL(
      'Anda belum masuk. Silakan login terlebih dahulu agar perubahan tersimpan ke server.',
    );
  }

  return null;
}

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
let hasLoadedInitialData = false;
let usingSeedFallback = false;
let seedInFlight = false;

/**
 * Dipakai ketika Firestore menolak pembacaan (mis. aturan keamanan belum
 * diterapkan atau perangkat offline). Aplikasi tetap dapat dibuka dengan data
 * contoh lokal; setiap penulisan tetap akan gagal dan dilaporkan lewat banner.
 */
function loadSeedFallback(reason: unknown) {
  if (usingSeedFallback || hasLoadedInitialData) return;

  usingSeedFallback = true;
  console.warn(
    '[firestore-service] Gagal membaca Firestore. Memakai data contoh lokal sementara.',
    reason,
  );

  cachedData = {
    classes: seedClasses,
    sessions: seedSessions,
    permits: seedPermits,
  };
  notifyListeners();
}

async function bootstrapFirestore() {
  if (seedInFlight) return;
  seedInFlight = true;

  try {
    let snapshot;

    try {
      snapshot = await getDocs(collection(getFirebaseFirestore(), 'classes'));
    } catch (err) {
      loadSeedFallback(err);
      return;
    }

    hasLoadedInitialData = true;

    if (!snapshot.empty) return;

    // Seeding membutuhkan user terautentikasi (aturan Firestore menolak write
    // anonim). Jangan mencoba menulis sebelum login.
    if (!getFirebaseAuth().currentUser) {
      console.log('[firestore-service] Lewati seeding: pengguna belum masuk.');
      return;
    }

    // Cek apakah data awal Firestore masih kosong, jika ya isi dengan SEED_DATA
    console.log('[firestore-service] Firestore masih kosong, memuat data awal (seeding)...');

    try {
      const batch = writeBatch(getFirebaseFirestore());
      seedClasses.forEach((cls: PracticumClass) => {
        batch.set(doc(getFirebaseFirestore(), 'classes', cls.id), cls);
      });
      seedSessions.forEach((ses: PracticumSession) => {
        batch.set(doc(getFirebaseFirestore(), 'sessions', ses.id), ses);
      });
      seedPermits.forEach((per: Permit) => {
        batch.set(doc(getFirebaseFirestore(), 'permits', per.id), per);
      });
      await batch.commit();
    } catch (err) {
      console.warn('[firestore-service] Gagal seeding data awal:', err);
    }
  } finally {
    seedInFlight = false;
  }
}

/**
 * Menginisialisasi listener getFirebaseFirestore() untuk koleksi classes, sessions, dan permits.
 */
function initFirestoreSync() {
  if (isSubscribed) return;
  isSubscribed = true;

  const classesRef = collection(getFirebaseFirestore(), 'classes');
  const sessionsRef = collection(getFirebaseFirestore(), 'sessions');
  const permitsRef = collection(getFirebaseFirestore(), 'permits');

  void bootstrapFirestore();

  // Setelah login (mis. dari mode demo), coba seeding lagi bila getFirebaseFirestore()
  // masih kosong. Tanpa ini, seeding pertama yang dilewati karena belum
  // terautentikasi tidak akan pernah diulang.
  const unsubAuth = onAuthStateChanged(getFirebaseAuth(), (user) => {
    if (user) {
      void bootstrapFirestore();
    }
  });

  const unsubClasses = onSnapshot(
    classesRef,
    (snap) => {
      hasLoadedInitialData = true;
      const classes = snap.docs.map((d) => ({ ...(d.data() as PracticumClass), id: d.id }));
      cachedData = { ...cachedData, classes };
      notifyListeners();
    },
    (err) => {
      console.warn('[firestore-service] Listener classes error:', err);
      loadSeedFallback(err);
    }
  );

  const unsubSessions = onSnapshot(
    sessionsRef,
    (snap) => {
      hasLoadedInitialData = true;
      const sessions = snap.docs.map((d) => ({ ...(d.data() as PracticumSession), id: d.id }));
      cachedData = { ...cachedData, sessions };
      notifyListeners();
    },
    (err) => {
      console.warn('[firestore-service] Listener sessions error:', err);
      loadSeedFallback(err);
    }
  );

  const unsubPermits = onSnapshot(
    permitsRef,
    (snap) => {
      hasLoadedInitialData = true;
      const permits = snap.docs.map((d) => ({ ...(d.data() as Permit), id: d.id }));
      cachedData = { ...cachedData, permits };
      notifyListeners();
    },
    (err) => {
      console.warn('[firestore-service] Listener permits error:', err);
      loadSeedFallback(err);
    }
  );

  unsubscribers = [unsubClasses, unsubSessions, unsubPermits, unsubAuth];
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
    const authError = requireAuth();
    if (authError) return authError;

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
      await setDoc(doc(getFirebaseFirestore(), 'classes', id), newClass);
      return { ok: true, id };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal membuat kelas.');
    }
  },

  async updateClass(id: string, input: ClassInput): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

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

      await updateDoc(doc(getFirebaseFirestore(), 'classes', id), updatedClass);

      // Perbarui denormalisasi pada sesi terkait
      const batch = writeBatch(getFirebaseFirestore());
      const relatedSessions = cachedData.sessions.filter((s) => s.classId === id);
      relatedSessions.forEach((s) => {
        batch.update(doc(getFirebaseFirestore(), 'sessions', s.id), {
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
    const authError = requireAuth();
    if (authError) return authError;

    const existing = cachedData.classes.find((c) => c.id === id);
    if (!existing) return FAIL('Kelas tidak ditemukan.');

    try {
      const batch = writeBatch(getFirebaseFirestore());
      batch.delete(doc(getFirebaseFirestore(), 'classes', id));

      // Hapus sesi terkait
      const relatedSessions = cachedData.sessions.filter((s) => s.classId === id);
      relatedSessions.forEach((s) => batch.delete(doc(getFirebaseFirestore(), 'sessions', s.id)));

      // Hapus izin terkait
      const relatedPermits = cachedData.permits.filter((p) => p.classId === id);
      relatedPermits.forEach((p) => batch.delete(doc(getFirebaseFirestore(), 'permits', p.id)));

      await batch.commit();
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menghapus kelas.');
    }
  },

  // FR-06 — peserta kelas
  async addParticipant(classId: string, input: ParticipantInput): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    const errors = validateParticipantInput(input);
    if (hasErrors(errors)) return FAIL(Object.values(errors)[0]);

    const cleanNim = input.nim.trim();
    const newParticipant: Participant = {
      id: generateId('par'),
      classId,
      name: input.name.trim(),
      nim: cleanNim,
    };
    const sessionIds = cachedData.sessions
      .filter((session) => session.classId === classId)
      .map((session) => session.id);

    try {
      // Transaksi menjaga roster kelas dan salinan peserta di tiap sesi tetap
      // konsisten walau dua perangkat menambah peserta bersamaan.
      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const classRef = doc(getFirebaseFirestore(), 'classes', classId);
        const classSnap = await transaction.get(classRef);
        if (!classSnap.exists()) {
          throw new Error('Kelas tidak ditemukan.');
        }

        const targetClass = classSnap.data() as PracticumClass;
        if (targetClass.participants.some((p) => p.nim === cleanNim)) {
          throw new Error('Praktikan dengan NIM tersebut sudah terdaftar di kelas ini.');
        }

        // Semua read harus selesai sebelum write pertama.
        const sessionSnaps = [];
        for (const sessionId of sessionIds) {
          sessionSnaps.push(await transaction.get(doc(getFirebaseFirestore(), 'sessions', sessionId)));
        }

        transaction.update(classRef, {
          participants: [...targetClass.participants, newParticipant],
        });

        sessionSnaps.forEach((snap) => {
          if (!snap.exists()) {
            return;
          }

          const session = snap.data() as PracticumSession;
          if (session.participants.some((p) => p.id === newParticipant.id)) {
            return;
          }

          transaction.update(snap.ref, {
            participants: [...session.participants, { ...newParticipant }],
          });
        });
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menambahkan peserta.');
    }
  },

  async removeParticipant(classId: string, participantId: string): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    const sessionIds = cachedData.sessions
      .filter((session) => session.classId === classId)
      .map((session) => session.id);
    const knownPermitIds = cachedData.permits
      .filter((permit) => permit.participantId === participantId)
      .map((permit) => permit.id);

    try {
      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const classRef = doc(getFirebaseFirestore(), 'classes', classId);
        const classSnap = await transaction.get(classRef);
        if (!classSnap.exists()) {
          throw new Error('Kelas tidak ditemukan.');
        }

        const targetClass = classSnap.data() as PracticumClass;
        const participant = targetClass.participants.find((p) => p.id === participantId);
        if (!participant) {
          throw new Error('Peserta tidak ditemukan pada kelas ini.');
        }

        const permitIds = new Set([
          ...knownPermitIds,
          ...cachedData.permits
            .filter((permit) => permit.nim === participant.nim)
            .map((permit) => permit.id),
        ]);

        // Semua read harus selesai sebelum write pertama.
        const sessionSnaps = [];
        for (const sessionId of sessionIds) {
          sessionSnaps.push(await transaction.get(doc(getFirebaseFirestore(), 'sessions', sessionId)));
        }

        const permitSnaps = [];
        for (const permitId of permitIds) {
          permitSnaps.push(await transaction.get(doc(getFirebaseFirestore(), 'permits', permitId)));
        }

        transaction.update(classRef, {
          participants: targetClass.participants.filter((p) => p.id !== participantId),
        });

        sessionSnaps.forEach((snap) => {
          if (!snap.exists()) {
            return;
          }

          const session = snap.data() as PracticumSession;
          transaction.update(snap.ref, {
            participants: session.participants.filter((p) => p.id !== participantId),
          });
        });

        permitSnaps.forEach((snap) => {
          if (snap.exists()) {
            transaction.delete(snap.ref);
          }
        });
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menghapus peserta.');
    }
  },

  // FR-07 / FR-08 — jadwal & sesi
  async createSession(input: SessionInput): Promise<MutationResult & { id?: string }> {
    const authError = requireAuth();
    if (authError) return authError;

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
      await setDoc(doc(getFirebaseFirestore(), 'sessions', id), newSession);
      return { ok: true, id };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal membuat sesi.');
    }
  },

  async updateSession(id: string, input: SessionInput): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

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

      await updateDoc(doc(getFirebaseFirestore(), 'sessions', id), updated);
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal memperbarui sesi.');
    }
  },

  async deleteSession(id: string): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    const existing = cachedData.sessions.find((s) => s.id === id);
    if (!existing) return FAIL('Sesi tidak ditemukan.');

    if (existing.status === 'berlangsung') {
      return FAIL('Sesi yang sedang berlangsung tidak dapat dihapus. Tutup sesi terlebih dahulu.');
    }

    try {
      const batch = writeBatch(getFirebaseFirestore());
      batch.delete(doc(getFirebaseFirestore(), 'sessions', id));

      // Cascade: hapus pengajuan izin yang menempel pada sesi ini.
      cachedData.permits
        .filter((permit) => permit.sessionId === id)
        .forEach((permit) => batch.delete(doc(getFirebaseFirestore(), 'permits', permit.id)));

      await batch.commit();
      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menghapus sesi.');
    }
  },

  async openSession(id: string): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    try {
      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const sessionRef = doc(getFirebaseFirestore(), 'sessions', id);
        const snap = await transaction.get(sessionRef);
        if (!snap.exists()) {
          throw new Error('Sesi tidak ditemukan.');
        }

        const session = snap.data() as PracticumSession;
        if (session.status === 'berlangsung') {
          throw new Error('Sesi sudah dalam status berlangsung.');
        }
        if (session.status === 'selesai') {
          throw new Error('Sesi yang sudah selesai tidak dapat dibuka kembali.');
        }

        transaction.update(sessionRef, {
          status: 'berlangsung',
          openedAt: formatClock(),
        });
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal membuka sesi.');
    }
  },

  async closeSession(id: string, note?: string): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    try {
      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const sessionRef = doc(getFirebaseFirestore(), 'sessions', id);
        const snap = await transaction.get(sessionRef);
        if (!snap.exists()) {
          throw new Error('Sesi tidak ditemukan.');
        }

        const session = snap.data() as PracticumSession;
        if (session.status === 'belum-dibuka') {
          throw new Error('Sesi belum pernah dibuka.');
        }
        if (session.status === 'selesai') {
          throw new Error('Sesi sudah selesai.');
        }

        transaction.update(sessionRef, {
          status: 'selesai',
          closedAt: formatClock(),
          closingNote: note?.trim() || undefined,
        });
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menutup sesi.');
    }
  },

  // FR-10 / FR-11 — presensi praktikan
  async checkIn(sessionId: string, participantId: string): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    try {
      // Transaksi membaca ulang dokumen sesi, sehingga dua praktikan yang
      // presensi bersamaan tidak saling menimpa array `participants`.
      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const sessionRef = doc(getFirebaseFirestore(), 'sessions', sessionId);
        const snap = await transaction.get(sessionRef);
        if (!snap.exists()) {
          throw new Error('Sesi tidak ditemukan.');
        }

        const session = snap.data() as PracticumSession;
        if (session.status === 'belum-dibuka') {
          throw new Error('Sesi belum dibuka oleh asisten praktikum.');
        }
        if (session.status === 'selesai') {
          throw new Error('Sesi sudah ditutup. Presensi tidak lagi diterima.');
        }

        const participantIndex = session.participants.findIndex(
          (participant) => participant.id === participantId,
        );
        if (participantIndex === -1) {
          throw new Error('Anda tidak terdaftar sebagai peserta pada sesi ini.');
        }

        const participant = session.participants[participantIndex];
        if (participant.checkInAt) {
          throw new Error(`Anda sudah tercatat hadir pada pukul ${participant.checkInAt}.`);
        }

        const updatedParticipants = [...session.participants];
        updatedParticipants[participantIndex] = {
          ...participant,
          checkInAt: formatClock(),
        };

        transaction.update(sessionRef, { participants: updatedParticipants });
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal mencatat presensi.');
    }
  },

  // FR-28 (Sprint 3, HF-03) — presensi tervalidasi radius geofencing & metadata audit
  async checkInWithLocation(input: CheckInLocationInput): Promise<CheckInLocationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    try {
      let auditResult: AttendanceAuditRecord | undefined;

      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const sessionRef = doc(getFirebaseFirestore(), 'sessions', input.sessionId);
        const snap = await transaction.get(sessionRef);
        if (!snap.exists()) {
          throw new Error('Sesi tidak ditemukan.');
        }

        const session = snap.data() as PracticumSession;
        let participantIndex = -1;
        if (input.participantId) {
          participantIndex = session.participants.findIndex((p) => p.id === input.participantId);
        }
        if (participantIndex === -1 && input.nim) {
          participantIndex = session.participants.findIndex((p) => p.nim === input.nim);
        }

        const participant = participantIndex !== -1 ? session.participants[participantIndex] : undefined;
        const validation = validateCheckInLocation(session, participant, input);
        if (!validation.valid || !validation.audit) {
          throw new Error(validation.reason || 'Gagal memvalidasi lokasi presensi.');
        }

        auditResult = validation.audit;
        const nowClock = formatClock();
        const updatedParticipants = [...session.participants];
        updatedParticipants[participantIndex] = {
          ...participant!,
          checkInAt: nowClock,
          distanceMeters: validation.audit.distanceMeters,
          verificationMethod: validation.audit.verificationMethod,
          isWithinRadius: true,
        };

        const auditRef = doc(getFirebaseFirestore(), `sessions/${input.sessionId}/attendance`, participant!.id);
        transaction.set(auditRef, validation.audit);
        transaction.update(sessionRef, { participants: updatedParticipants });
      });

      return { ok: true, audit: auditResult };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal mencatat presensi lokasi.');
    }
  },

  // FR-16 s/d FR-18 — pengajuan izin praktikan & klasifikasi Gemini AI
  async submitPermit(
    input: SubmitPermitInput
  ): Promise<MutationResult & { permit?: Permit }> {
    const authError = requireAuth();
    if (authError) return authError;

    const session = cachedData.sessions.find((s) => s.id === input.sessionId);
    if (!session) return FAIL('Sesi praktikum tidak ditemukan.');

    const reason = input.reason.trim();
    if (!reason || reason.length < 5) {
      return FAIL('Alasan izin terlalu singkat. Harap jelaskan minimal 5 karakter.');
    }

    // Identifikasi mahasiswa yang mengajukan. Akun Firebase Auth memakai uid,
    // sedangkan roster memakai Participant.id — cocokkan juga lewat NIM.
    const requestedId = input.participantId || CURRENT_PRACTIKAN_ID;
    const participant =
      session.participants.find((p) => p.id === requestedId) ??
      (input.nim ? session.participants.find((p) => p.nim === input.nim) : undefined);
    const participantId = participant?.id ?? requestedId;

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

      // Simpan hasil klasifikasi AI ke Cloud getFirebaseFirestore() (FR-18)
      await setDoc(doc(getFirebaseFirestore(), 'permits', id), newPermit);

      return { ok: true, permit: newPermit };
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal memproses pengajuan izin.');
    }
  },

  // FR-20 — keputusan izin oleh Asprak
  async decidePermit(id: string, decision: PermitDecisionInput): Promise<MutationResult> {
    const authError = requireAuth();
    if (authError) return authError;

    try {
      await runTransaction(getFirebaseFirestore(), async (transaction) => {
        const permitRef = doc(getFirebaseFirestore(), 'permits', id);
        const snap = await transaction.get(permitRef);
        if (!snap.exists()) {
          throw new Error('Pengajuan izin tidak ditemukan.');
        }

        const permit = snap.data() as Permit;
        if (permit.status !== 'menunggu') {
          throw new Error('Pengajuan izin ini sudah diputuskan.');
        }

        transaction.update(permitRef, {
          status: decision.status,
          decidedAt: new Date().toISOString(),
          decidedBy: decision.decidedBy,
          decisionNote: decision.note?.trim() || undefined,
        });
      });

      return SUCCESS;
    } catch (err: any) {
      return FAIL(err?.message || 'Gagal menyimpan keputusan izin.');
    }
  },
};

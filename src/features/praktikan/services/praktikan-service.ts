import { dummySessions } from '@/data/sessions';
import { formatClock } from '@/utils/format-clock';

import type {
  AIClassification,
  AttendanceRecord,
  CheckInResponse,
  LeaveInput,
  LeaveRequest,
  LeaveSubmitResponse,
  PraktikanUser,
  PracticumSession,
} from '../types';

/**
 * ============================================================================
 * KONSTANTA PENGGUNA PRAKTIKAN (AUTH DUMMY)
 * ============================================================================
 * Konstanta ini mewakili praktikan yang sedang aktif/login.
 * Sangat mudah diganti ke `auth().currentUser?.uid` saat Firebase diintegrasikan.
 */
export const DUMMY_CURRENT_USER_ID = 'p6';

export const CURRENT_PRAKTIKAN: PraktikanUser = {
  id: DUMMY_CURRENT_USER_ID,
  nim: '24060122140006',
  name: 'Fajar Nugroho',
  email: 'fajar.nugroho@students.undip.ac.id',
  classGroup: 'Kelas A',
};

// State pengguna yang login saat ini (dapat disimulasikan null untuk skenario belum login)
let activeUser: PraktikanUser | null = { ...CURRENT_PRAKTIKAN };

export function getCurrentPraktikan(): PraktikanUser | null {
  return activeUser ? { ...activeUser } : null;
}

export function setCurrentPraktikan(user: PraktikanUser | null) {
  activeUser = user ? { ...user } : null;
  notifyAll();
}

/**
 * ============================================================================
 * IN-MEMORY DATA STORE (SIMULASI FIRESTORE)
 * ============================================================================
 */
// Clone sesi dari dummySessions
let inMemorySessions: PracticumSession[] = JSON.parse(JSON.stringify(dummySessions));

// Data riwayat presensi awal
let inMemoryAttendance: AttendanceRecord[] = [
  {
    id: 'att-hist-1',
    sessionId: 'sesi-strukturdata-c',
    sessionTitle: 'Praktikum Struktur Data - Pertemuan 3',
    courseName: 'Praktikum Struktur Data',
    classGroup: 'Kelas C',
    room: 'Lab Komputer 2',
    dateLabel: '28 Oktober 2026',
    timeLabel: '13:00 - 15:00',
    studentId: DUMMY_CURRENT_USER_ID,
    studentName: CURRENT_PRAKTIKAN.name,
    studentNim: CURRENT_PRAKTIKAN.nim,
    status: 'hadir',
    checkInAt: '13:12',
    notes: 'Presensi tercatat tepat waktu',
  },
];

// Data awal pengajuan izin (FR-21 demonstrasi)
let inMemoryLeaves: LeaveRequest[] = [
  {
    id: 'leave-sample-1',
    sessionId: 'sesi-basisdata-b',
    sessionTitle: 'Praktikum Basis Data - Pertemuan 2',
    courseName: 'Praktikum Basis Data',
    studentId: DUMMY_CURRENT_USER_ID,
    studentName: CURRENT_PRAKTIKAN.name,
    studentNim: CURRENT_PRAKTIKAN.nim,
    reason: 'Mengalami demam tinggi dan flu sejak semalam, sedang beristirahat sesuai anjuran dokter.',
    notes: 'Surat dokter terlampir di klinik kampus',
    submittedAt: '27 Okt 2026, 07:45',
    status: 'menunggu', // Status selalu menunggu keputusan Asisten
    aiClassification: {
      predictedCategory: 'Kesehatan / Medis',
      confidence: 0.94,
      summary: 'Alasan mengindikasikan gangguan kesehatan/sakit dengan kepastian tinggi.',
      urgency: 'tinggi',
      disclaimer: 'Analisis AI bersifat informasi pendukung. Keputusan penerimaan/penolakan izin sepenuhnya wewenang Asisten.',
    },
  },
];

/**
 * ============================================================================
 * SUBSCRIBER LISTENERS (SIMULASI FIRESTORE ONSNAPSHOT)
 * ============================================================================
 */
type SessionListener = (sessions: PracticumSession[]) => void;
type AttendanceListener = (records: AttendanceRecord[]) => void;
type LeaveListener = (leaves: LeaveRequest[]) => void;

const sessionListeners = new Set<SessionListener>();
const attendanceListeners = new Set<AttendanceListener>();
const leaveListeners = new Set<LeaveListener>();

function emitSessions() {
  const data = JSON.parse(JSON.stringify(inMemorySessions));
  sessionListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (e) {
      console.error('Error in sessionListener:', e);
    }
  });
}

function emitAttendance() {
  const currentId = activeUser?.id;
  const data: AttendanceRecord[] = currentId
    ? JSON.parse(JSON.stringify(inMemoryAttendance.filter((a) => a.studentId === currentId)))
    : [];
  attendanceListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (e) {
      console.error('Error in attendanceListener:', e);
    }
  });
}

function emitLeaves() {
  const currentId = activeUser?.id;
  const data: LeaveRequest[] = currentId
    ? JSON.parse(JSON.stringify(inMemoryLeaves.filter((l) => l.studentId === currentId)))
    : [];
  leaveListeners.forEach((listener) => {
    try {
      listener(data);
    } catch (e) {
      console.error('Error in leaveListener:', e);
    }
  });
}

function notifyAll() {
  emitSessions();
  emitAttendance();
  emitLeaves();
}

/**
 * ============================================================================
 * MESIN KLASIFIKASI AI DUMMY (FR-21)
 * Informasi pendukung: tidak pernah otomatis mengubah status izin jadi diterima/ditolak.
 * Kategori izin diprediksi otomatis oleh AI berdasarkan teks alasan izin.
 * ============================================================================
 */
function analyzeWithAI(reasonText: string): AIClassification {
  const text = reasonText.toLowerCase();

  const isMedical =
    /sakit|demam|flu|batuk|pusing|mual|rawat|dokter|klinik|puskesmas|opname|gejala|istirahat/.test(
      text,
    );
  const isAcademic =
    /lomba|sidang|seminar|konferensi|workshop|tugas|delegasi|kampus|organisasi|dispensasi|kkn/.test(
      text,
    );
  const isUrgent =
    /keluarga|darurat|musibah|duka|meninggal|bencana|kecelakaan|rusak|kendaraan|banjir/.test(text);

  let predictedCategory = 'Lainnya / Perlu Klarifikasi';
  let confidence = 0.74;
  let summary = 'Alasan umum. Disarankan memverifikasi bukti pendukung secara manual.';
  let urgency: 'rendah' | 'sedang' | 'tinggi' = 'rendah';

  if (isMedical) {
    predictedCategory = 'Kesehatan / Medis';
    confidence = 0.94;
    summary =
      'Alasan mengindikasikan kondisi sakit / kendala fisik. Disarankan melampirkan surat dokter jika berhalangan lebih dari 1 sesi.';
    urgency = 'tinggi';
  } else if (isAcademic) {
    predictedCategory = 'Kegiatan Akademik Resmi';
    confidence = 0.91;
    summary =
      'Alasan mengindikasikan kegiatan akademik atau perwakilan kampus resmi. Disarankan verifikasi surat tugas/undangan.';
    urgency = 'sedang';
  } else if (isUrgent) {
    predictedCategory = 'Keperluan Mendesak / Keluarga';
    confidence = 0.89;
    summary =
      'Alasan mengindikasikan situasi darurat keluarga atau kendala transportasi/musibah yang wajar.';
    urgency = 'sedang';
  }

  return {
    predictedCategory,
    confidence,
    summary,
    urgency,
    disclaimer:
      'Klasifikasi AI hanya merupakan informasi pendukung. Keputusan penerimaan atau penolakan izin sepenuhnya di tangan Asisten Praktikum.',
  };
}

/**
 * ============================================================================
 * SERVICE API FUNCTIONS (SESUAI PERMINTAAN KONTRAK)
 * ============================================================================
 */

/**
 * Mengambil daftar sesi praktikum (FR-07, FR-09).
 */
export async function getSessions(): Promise<PracticumSession[]> {
  await new Promise((res) => setTimeout(res, 80));
  return JSON.parse(JSON.stringify(inMemorySessions));
}

/**
 * Melakukan subscription real-time terhadap daftar sesi praktikum.
 * Mengembalikan fungsi unsubscribe layaknya listener Firestore onSnapshot.
 */
export function subscribeSessions(callback: (sessions: PracticumSession[]) => void): () => void {
  sessionListeners.add(callback);
  // Panggil langsung pada registrasi awal
  callback(JSON.parse(JSON.stringify(inMemorySessions)));

  return () => {
    sessionListeners.delete(callback);
  };
}

/**
 * Melakukan presensi (check-in) pada sesi tertentu (FR-10, FR-11, FR-22).
 */
export async function checkIn(sessionId: string): Promise<CheckInResponse> {
  await new Promise((res) => setTimeout(res, 120));

  if (!activeUser) {
    return { ok: false, message: 'Anda belum login sebagai praktikan.', reason: 'unauthenticated' };
  }

  const session = inMemorySessions.find((s) => s.id === sessionId);
  if (!session) {
    return { ok: false, message: 'Sesi praktikum tidak ditemukan.', reason: 'session_not_found' };
  }

  // FR-22: Batasi tindakan berdasarkan status sesi
  if (session.status === 'belum-dibuka') {
    return {
      ok: false,
      message: 'Presensi gagal: Sesi belum dibuka oleh Asisten Praktikum.',
      reason: 'session_not_opened',
    };
  }

  if (session.status === 'selesai') {
    return {
      ok: false,
      message: 'Presensi gagal: Sesi praktikum telah ditutup.',
      reason: 'session_closed',
    };
  }

  // FR-11: Cek apakah sudah presensi (tidak boleh presensi ganda)
  const existingRecord = inMemoryAttendance.find(
    (a) => a.sessionId === sessionId && a.studentId === activeUser?.id,
  );
  if (existingRecord && existingRecord.status === 'hadir') {
    return {
      ok: false,
      message: 'Anda sudah melakukan presensi pada sesi ini sebelumnya.',
      reason: 'already_checked_in',
    };
  }

  // Cek apakah praktikan terdaftar di sesi tersebut
  const isParticipant = session.participants.some((p) => p.id === activeUser?.id);
  if (!isParticipant) {
    return {
      ok: false,
      message: 'Anda tidak terdaftar sebagai peserta pada sesi ini.',
      reason: 'not_enrolled',
    };
  }

  // Cek apakah ada izin yang sudah diterima
  const acceptedLeave = inMemoryLeaves.find(
    (l) => l.sessionId === sessionId && l.studentId === activeUser?.id && l.status === 'diterima',
  );
  if (acceptedLeave) {
    return {
      ok: false,
      message: 'Anda telah mendapatkan izin pada sesi ini sehingga tidak dapat melakukan presensi.',
      reason: 'leave_accepted',
    };
  }

  const nowClock = formatClock();

  // Catat presensi di riwayat kehadiran (FR-14)
  const newAttendanceRecord: AttendanceRecord = {
    id: `att-${sessionId}-${activeUser.id}-${Date.now()}`,
    sessionId: session.id,
    sessionTitle: `${session.courseName} (${session.classGroup})`,
    courseName: session.courseName,
    classGroup: session.classGroup,
    room: session.room,
    dateLabel: session.dateLabel,
    timeLabel: `${session.startTime} - ${session.endTime}`,
    studentId: activeUser.id,
    studentName: activeUser.name,
    studentNim: activeUser.nim,
    status: 'hadir',
    checkInAt: nowClock,
    notes: 'Presensi mandiri oleh praktikan',
  };

  // Update inMemoryAttendance (replace jika sebelumnya tercatat status lain)
  inMemoryAttendance = inMemoryAttendance.filter(
    (a) => !(a.sessionId === sessionId && a.studentId === activeUser?.id),
  );
  inMemoryAttendance.unshift(newAttendanceRecord);

  // Update sesi participants checkInAt agar sinkron
  inMemorySessions = inMemorySessions.map((s) => {
    if (s.id !== sessionId) return s;
    return {
      ...s,
      participants: s.participants.map((p) =>
        p.id === activeUser?.id ? { ...p, checkInAt: nowClock } : p,
      ),
    };
  });

  emitAttendance();
  emitSessions();

  return {
    ok: true,
    message: `Presensi berhasil dicatat pada pukul ${nowClock} WIB.`,
    timestamp: nowClock,
  };
}

/**
 * Mengambil riwayat kehadiran praktikan yang sedang login (FR-14).
 */
export async function getAttendanceHistory(): Promise<AttendanceRecord[]> {
  await new Promise((res) => setTimeout(res, 80));
  if (!activeUser) return [];
  return JSON.parse(
    JSON.stringify(inMemoryAttendance.filter((a) => a.studentId === activeUser?.id)),
  );
}

/**
 * Melakukan subscription real-time terhadap riwayat presensi praktikan aktif.
 */
export function subscribeAttendance(callback: (records: AttendanceRecord[]) => void): () => void {
  attendanceListeners.add(callback);
  const currentId = activeUser?.id;
  const initial = currentId
    ? JSON.parse(JSON.stringify(inMemoryAttendance.filter((a) => a.studentId === currentId)))
    : [];
  callback(initial);

  return () => {
    attendanceListeners.delete(callback);
  };
}

/**
 * Mengajukan permohonan izin untuk sesi tertentu (FR-16, FR-21).
 */
export async function submitLeave(leaveInput: LeaveInput): Promise<LeaveSubmitResponse> {
  await new Promise((res) => setTimeout(res, 150));

  if (!activeUser) {
    return { ok: false, message: 'Anda belum login sebagai praktikan.', error: 'unauthenticated' };
  }

  // Validasi input: alasan wajib diisi (FR-16)
  const trimmedReason = leaveInput.reason?.trim() ?? '';
  if (!trimmedReason || trimmedReason.length < 5) {
    return {
      ok: false,
      message: 'Alasan izin wajib diisi dengan jelas (minimal 5 karakter).',
      error: 'reason_too_short',
    };
  }

  const session = inMemorySessions.find((s) => s.id === leaveInput.sessionId);
  if (!session) {
    return { ok: false, message: 'Sesi praktikum tidak ditemukan.', error: 'session_not_found' };
  }

  // Cek apakah praktikan sudah hadir
  const hasAttended = inMemoryAttendance.some(
    (a) => a.sessionId === session.id && a.studentId === activeUser?.id && a.status === 'hadir',
  );
  if (hasAttended) {
    return {
      ok: false,
      message: 'Anda telah tercatat hadir pada sesi ini. Tidak dapat mengajukan izin.',
      error: 'already_attended',
    };
  }

  // Cek apakah sudah pernah mengajukan izin untuk sesi ini yang sedang menunggu atau sudah diterima
  const existingPending = inMemoryLeaves.find(
    (l) =>
      l.sessionId === session.id &&
      l.studentId === activeUser?.id &&
      (l.status === 'menunggu' || l.status === 'diterima'),
  );
  if (existingPending) {
    return {
      ok: false,
      message: `Anda sudah memiliki pengajuan izin untuk sesi ini (status: ${existingPending.status}).`,
      error: 'leave_already_submitted',
    };
  }

  // Jalankan analisis AI sebagai informasi pendukung (FR-21)
  const aiResult = analyzeWithAI(trimmedReason);

  const now = new Date();
  const dateFormatted = `${now.getDate()} ${
    ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
      now.getMonth()
    ]
  } ${now.getFullYear()}, ${formatClock(now)}`;

  const newLeave: LeaveRequest = {
    id: `leave-${session.id}-${activeUser.id}-${Date.now()}`,
    sessionId: session.id,
    sessionTitle: `${session.courseName} - ${session.classGroup}`,
    courseName: session.courseName,
    studentId: activeUser.id,
    studentName: activeUser.name,
    studentNim: activeUser.nim,
    reason: trimmedReason,
    notes: leaveInput.notes?.trim() || undefined,
    submittedAt: dateFormatted,
    status: 'menunggu', // Izin selalu menunggu, AI TIDAK PERNAH memutuskan otomatis
    aiClassification: aiResult,
  };

  inMemoryLeaves.unshift(newLeave);
  emitLeaves();

  return {
    ok: true,
    message: 'Pengajuan izin berhasil dikirim dan sedang menunggu verifikasi Asisten Praktikum.',
    leave: newLeave,
  };
}

/**
 * Melakukan subscription real-time terhadap daftar izin yang diajukan praktikan aktif (FR-21).
 */
export function subscribeLeaves(callback: (leaves: LeaveRequest[]) => void): () => void {
  leaveListeners.add(callback);
  const currentId = activeUser?.id;
  const initial = currentId
    ? JSON.parse(JSON.stringify(inMemoryLeaves.filter((l) => l.studentId === currentId)))
    : [];
  callback(initial);

  return () => {
    leaveListeners.delete(callback);
  };
}

/**
 * ============================================================================
 * HELPER / DEV SIMULATOR UNTUK PENGUJIAN DEMO
 * ============================================================================
 */

/**
 * Simulasi Asisten Praktikum meninjau/merespons izin praktikan ('diterima' | 'ditolak').
 * Berguna untuk mendemonstrasikan perubahan status izin FR-21 di demo.
 */
export function devReviewLeave(
  leaveId: string,
  newStatus: 'diterima' | 'ditolak',
  reviewerNote?: string,
) {
  inMemoryLeaves = inMemoryLeaves.map((leave) => {
    if (leave.id !== leaveId) return leave;
    const now = new Date();
    const dateFormatted = `${now.getDate()} ${
      ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][
        now.getMonth()
      ]
    } ${now.getFullYear()}, ${formatClock(now)}`;

    return {
      ...leave,
      status: newStatus,
      reviewedAt: dateFormatted,
      reviewedBy: 'Johan Reinhart Calvin (Asprak)',
      reviewerNote: reviewerNote || (newStatus === 'diterima' ? 'Izin disetujui' : 'Alasan kurang memadai'),
    };
  });

  emitLeaves();
}

/**
 * Reset data dummy ke kondisi awal.
 */
export function devResetAllData() {
  inMemorySessions = JSON.parse(JSON.stringify(dummySessions));
  inMemoryAttendance = [
    {
      id: 'att-hist-1',
      sessionId: 'sesi-strukturdata-c',
      sessionTitle: 'Praktikum Struktur Data - Pertemuan 3',
      courseName: 'Praktikum Struktur Data',
      classGroup: 'Kelas C',
      room: 'Lab Komputer 2',
      dateLabel: '28 Oktober 2026',
      timeLabel: '13:00 - 15:00',
      studentId: DUMMY_CURRENT_USER_ID,
      studentName: CURRENT_PRAKTIKAN.name,
      studentNim: CURRENT_PRAKTIKAN.nim,
      status: 'hadir',
      checkInAt: '13:12',
      notes: 'Presensi tercatat tepat waktu',
    },
  ];
  inMemoryLeaves = [
    {
      id: 'leave-sample-1',
      sessionId: 'sesi-basisdata-b',
      sessionTitle: 'Praktikum Basis Data - Pertemuan 2',
      courseName: 'Praktikum Basis Data',
      studentId: DUMMY_CURRENT_USER_ID,
      studentName: CURRENT_PRAKTIKAN.name,
      studentNim: CURRENT_PRAKTIKAN.nim,
      reason: 'Mengalami demam tinggi dan flu sejak semalam, sedang beristirahat sesuai anjuran dokter.',
      notes: 'Surat dokter terlampir di klinik kampus',
      submittedAt: '27 Okt 2026, 07:45',
      status: 'menunggu',
      aiClassification: {
        predictedCategory: 'Kesehatan / Medis',
        confidence: 0.94,
        summary: 'Alasan mengindikasikan gangguan kesehatan/sakit dengan kepastian tinggi.',
        urgency: 'tinggi',
        disclaimer: 'Analisis AI bersifat informasi pendukung. Keputusan penerimaan/penolakan izin sepenuhnya wewenang Asisten.',
      },
    },
  ];
  activeUser = { ...CURRENT_PRAKTIKAN };
  notifyAll();
}

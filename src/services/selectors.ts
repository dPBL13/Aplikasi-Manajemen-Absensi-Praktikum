import type {
  AppData,
  Participant,
  Permit,
  PracticumClass,
  PracticumSession,
  SessionParticipant,
} from '@/types/domain';

/**
 * Selector murni (tanpa React, tanpa I/O) untuk perhitungan lintas layar.
 * Dipakai bersama modul Asprak & Praktikan agar angka selalu konsisten.
 */

export type AttendanceSummary = {
  total: number;
  attended: number;
  absent: number;
  /** 0–100, dibulatkan. */
  rate: number;
};

export function summarizeAttendance(session: PracticumSession): AttendanceSummary {
  const total = session.participants.length;
  const attended = session.participants.filter((participant) => participant.checkInAt).length;

  return {
    total,
    attended,
    absent: total - attended,
    rate: total === 0 ? 0 : Math.round((attended / total) * 100),
  };
}

export function findClass(data: AppData, id: string | undefined): PracticumClass | undefined {
  return id ? data.classes.find((item) => item.id === id) : undefined;
}

export function findSession(data: AppData, id: string | undefined): PracticumSession | undefined {
  return id ? data.sessions.find((item) => item.id === id) : undefined;
}

export function findPermit(data: AppData, id: string | undefined): Permit | undefined {
  return id ? data.permits.find((item) => item.id === id) : undefined;
}

/**
 * Sesi yang diikuti seorang praktikan (berdasarkan roster sesi).
 * Identitas dicocokkan lewat `participantId` (id roster) atau `nim`, karena
 * akun Firebase Auth memakai uid yang berbeda dari `Participant.id`.
 */
export function sessionsForParticipant(
  data: AppData,
  participantId: string,
  nim?: string,
): PracticumSession[] {
  return data.sessions.filter((session) =>
    session.participants.some(
      (participant) => participant.id === participantId || (nim ? participant.nim === nim : false),
    ),
  );
}

export function findSessionParticipant(
  session: PracticumSession,
  participantId: string,
  nim?: string,
): SessionParticipant | undefined {
  return session.participants.find(
    (participant) => participant.id === participantId || (nim ? participant.nim === nim : false),
  );
}

/** Peserta kelas tempat praktikan terdaftar (dipakai untuk lookup identitas). */
export function findParticipant(data: AppData, participantId: string): Participant | undefined {
  for (const practicumClass of data.classes) {
    const participant = practicumClass.participants.find((item) => item.id === participantId);

    if (participant) {
      return participant;
    }
  }

  return undefined;
}

/** Cari peserta berdasarkan NIM (kunci yang dipakai akun Firebase Auth praktikan). */
export function findParticipantByNim(data: AppData, nim: string): Participant | undefined {
  if (!nim) {
    return undefined;
  }

  for (const practicumClass of data.classes) {
    const participant = practicumClass.participants.find((item) => item.nim === nim);

    if (participant) {
      return participant;
    }
  }

  return undefined;
}

export function permitsForSession(data: AppData, sessionId: string): Permit[] {
  return data.permits.filter((permit) => permit.sessionId === sessionId);
}

export function pendingPermits(data: AppData): Permit[] {
  return data.permits.filter((permit) => permit.status === 'menunggu');
}

export type AsprakOverview = {
  classCount: number;
  sessionCount: number;
  ongoingCount: number;
  pendingPermitCount: number;
  /** Rata-rata persentase kehadiran pada sesi yang sudah dibuka. */
  attendanceRate: number;
};

/** Ringkasan untuk header dashboard Asprak (FR-09). */
export function asprakOverview(data: AppData): AsprakOverview {
  const sessionsWithAttendance = data.sessions.filter(
    (session) => session.status !== 'belum-dibuka',
  );
  const totals = sessionsWithAttendance.map(summarizeAttendance);
  const attended = totals.reduce((sum, item) => sum + item.attended, 0);
  const total = totals.reduce((sum, item) => sum + item.total, 0);

  return {
    classCount: data.classes.length,
    sessionCount: data.sessions.length,
    ongoingCount: data.sessions.filter((session) => session.status === 'berlangsung').length,
    pendingPermitCount: pendingPermits(data).length,
    attendanceRate: total === 0 ? 0 : Math.round((attended / total) * 100),
  };
}

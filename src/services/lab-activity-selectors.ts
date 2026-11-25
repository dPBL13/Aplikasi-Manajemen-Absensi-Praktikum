import type { Laboratory, PracticumSession } from '@/types/domain';
import { parseDateLabel } from '@/utils/date-label';

/**
 * Aktivitas laboratorium real-time (JH-06, FR-31).
 *
 * Selector murni (tanpa React/Firebase) — mudah diuji. Hook realtime ada di
 * `lab-activity.ts`. Hanya membaca sesi; tidak menyentuh data presensi.
 */

export interface LabActivity {
  /** Sesi berstatus `berlangsung` di lab ini (bisa >1 bila data anomali). */
  ongoing: PracticumSession[];
  /** Sesi hari ini yang belum dibuka dan mulai setelah `now`, terdekat pertama. */
  next: PracticumSession | null;
}

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Apakah sesi dilaksanakan di lab ini?
 * 1) `laboratoryId` eksplisit menang. 2) Sesi lama tanpa `laboratoryId`
 * dicocokkan dari teks `room` terhadap kode/nama lab.
 */
export function sessionBelongsToLab(session: PracticumSession, lab: Laboratory): boolean {
  if (session.laboratoryId) return session.laboratoryId === lab.id;

  const room = normalize(session.room);
  if (!room) return false;

  const candidates = [lab.name, lab.code, lab.code.replace(/^lab[-\s]*/i, '')]
    .map(normalize)
    .filter((candidate) => candidate.length >= 3);

  return candidates.some((candidate) => room === candidate || room.includes(candidate));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfSession(session: PracticumSession): Date | null {
  const day = parseDateLabel(session.dateLabel);
  const match = /^(\d{1,2}):(\d{2})$/.exec(session.startTime.trim());
  if (!day || !match) return null;
  day.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return day;
}

/** Fungsi murni (mudah diuji): hitung aktivitas satu lab pada waktu `now`. */
export function getLabActivity(
  sessions: PracticumSession[],
  lab: Laboratory,
  now: Date,
): LabActivity {
  const labSessions = sessions.filter((session) => sessionBelongsToLab(session, lab));

  const ongoing = labSessions.filter((session) => session.status === 'berlangsung');

  const upcoming = labSessions
    .filter((session) => session.status === 'belum-dibuka')
    .map((session) => ({ session, start: startOfSession(session) }))
    .filter(
      (entry): entry is { session: PracticumSession; start: Date } =>
        entry.start !== null && isSameDay(entry.start, now) && entry.start.getTime() > now.getTime(),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  return { ongoing, next: upcoming[0]?.session ?? null };
}


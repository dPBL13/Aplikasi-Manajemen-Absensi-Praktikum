import type { PracticumSession, PushNotificationPayload } from '@/types/domain';

export const PRESENSI_ROUTE = '/praktikan/presensi'; // Menggunakan /praktikan/session/[id] sesuai handoff sebelum HF-01 merge

/**
 * Mendeteksi apakah status sesi praktikum berubah menjadi 'berlangsung' (dibuka oleh Asprak).
 */
export function detectSessionOpened(
  prev: PracticumSession | undefined | null,
  next: PracticumSession
): boolean {
  if (!prev) return false;
  
  return prev.status !== 'berlangsung' && next.status === 'berlangsung';
}

/**
 * Membangun payload notifikasi push untuk sesi yang telah dibuka.
 * Mengikuti SRS FR-32 dan Design: "Sesi Praktikum Telah Dibuka: {courseName} ({classGroup}). Segera lakukan presensi di {room}!"
 */
export function buildSessionOpenedPayload(session: PracticumSession): PushNotificationPayload {
  const targetScreen = `${PRESENSI_ROUTE}/${session.id}`;
  return {
    title: 'SIPRAK Informatika Undip',
    body: `Sesi Praktikum Telah Dibuka: ${session.courseName} (${session.classGroup}). Segera lakukan presensi di ${session.room}!`,
    data: {
      type: 'SESSION_OPENED',
      sessionId: session.id,
      screen: targetScreen,
      params: {
        sessionId: session.id,
        courseName: session.courseName,
      },
    },
  };
}

/**
 * Mendapatkan daftar NIM unik peserta dari sesi praktikum terkait (BR-07).
 */
export function resolveSessionRecipientNims(session: PracticumSession): string[] {
  if (!session.participants || !Array.isArray(session.participants)) {
    return [];
  }

  const nims = session.participants
    .map((p) => p.nim)
    .filter((nim): nim is string => typeof nim === 'string' && nim.trim().length > 0);

  return Array.from(new Set(nims));
}

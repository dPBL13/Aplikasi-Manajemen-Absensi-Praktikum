import type { PracticumSession, Permit, PushNotificationPayload } from '@/types/domain';

/**
 * Mendeteksi apakah ada perubahan jadwal atau ruangan pada sesi praktikum.
 * Mengabaikan sesi baru (prev undefined) dan hanya memicu jika ada field jadwal yang berbeda.
 */
export function detectScheduleChanged(
  prev: PracticumSession | undefined | null,
  next: PracticumSession
): boolean {
  if (!prev) return false;

  return (
    prev.dayLabel !== next.dayLabel ||
    prev.dateLabel !== next.dateLabel ||
    prev.startTime !== next.startTime ||
    prev.endTime !== next.endTime ||
    prev.room !== next.room
  );
}

/**
 * Membangun payload notifikasi perubahan jadwal sesi (FR-32).
 */
export function buildScheduleChangedPayload(session: PracticumSession): PushNotificationPayload {
  return {
    title: 'SIPRAK Informatika Undip',
    body: `Pemberitahuan: Jadwal praktikum ${session.courseName} mengalami perubahan`,
    data: {
      type: 'SCHEDULE_CHANGED',
      sessionId: session.id,
      screen: `/praktikan/session/${session.id}`,
      params: {
        sessionId: session.id,
        courseName: session.courseName,
      },
    },
  };
}

/**
 * Mendeteksi keputusan status izin praktikan (dari 'menunggu' -> 'diterima' | 'ditolak').
 */
export function detectPermitDecision(
  prev: Permit | undefined | null,
  next: Permit
): boolean {
  if (!prev) return false;

  return (
    prev.status === 'menunggu' &&
    (next.status === 'diterima' || next.status === 'ditolak')
  );
}

/**
 * Membangun payload notifikasi status pengajuan izin (FR-32, BR-08).
 * Target screen mengarah ke riwayat praktikan (/praktikan/riwayat).
 */
export function buildPermitDecisionPayload(permit: Permit): PushNotificationPayload {
  const statusLabel = permit.status === 'diterima' ? 'Diterima' : 'Ditolak';

  return {
    title: 'SIPRAK Informatika Undip',
    body: `Status Izin: Pengajuan izin Anda untuk sesi ${permit.courseName} telah ${statusLabel}`,
    data: {
      type: 'PERMIT_DECISION',
      permitId: permit.id,
      sessionId: permit.sessionId,
      screen: '/praktikan/riwayat',
      params: {
        permitId: permit.id,
        status: permit.status,
      },
    },
  };
}

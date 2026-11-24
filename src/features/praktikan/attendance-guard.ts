import type { PracticumSession, SessionParticipant } from '@/types/domain';

export interface AttendanceGuardStatus {
  canCheckIn: boolean;
  statusType: 'ready' | 'outside_radius' | 'already_checked_in' | 'not_open' | 'closed' | 'offline' | 'mock_gps' | 'not_enrolled';
  message: string;
}

/**
 * HF-04: Guard middleware dan helper evaluasi kondisi presensi praktikan.
 * Menjamin penegakan BR-01, BR-02, BR-03, BR-04, dan BR-10 sebelum eksekusi check-in.
 */
export function evaluateAttendanceGuard({
  session,
  participant,
  isOnline = true,
  isWithinRadius = false,
  isMocked = false,
  distanceMeters,
  radiusMeters = 50,
}: {
  session?: PracticumSession | null;
  participant?: SessionParticipant | null;
  isOnline?: boolean;
  isWithinRadius?: boolean;
  isMocked?: boolean;
  distanceMeters?: number;
  radiusMeters?: number;
}): AttendanceGuardStatus {
  // BR-10: Perilaku Offline Graceful
  if (!isOnline) {
    return {
      canCheckIn: false,
      statusType: 'offline',
      message: 'Koneksi internet terputus. Harap sambungkan internet untuk memvalidasi presensi.',
    };
  }

  if (!session) {
    return {
      canCheckIn: false,
      statusType: 'not_open',
      message: 'Sesi praktikum tidak ditemukan.',
    };
  }

  // BR-01: Kondisi Keabsahan Sesi
  if (session.status === 'belum-dibuka') {
    return {
      canCheckIn: false,
      statusType: 'not_open',
      message: 'Sesi belum dibuka oleh asisten praktikum. Tombol presensi akan aktif setelah sesi dibuka.',
    };
  }

  if (session.status === 'selesai') {
    return {
      canCheckIn: false,
      statusType: 'closed',
      message: 'Sesi praktikum telah ditutup. Presensi baru tidak dapat dilakukan.',
    };
  }

  if (!participant) {
    return {
      canCheckIn: false,
      statusType: 'not_enrolled',
      message: 'Anda tidak terdaftar sebagai peserta pada sesi kelas ini.',
    };
  }

  // BR-03: Anti-Presensi Ganda (Idempotensi)
  if (participant.checkInAt) {
    return {
      canCheckIn: false,
      statusType: 'already_checked_in',
      message: `Presensi Anda telah tercatat pada pukul ${participant.checkInAt}.`,
    };
  }

  // BR-04: Integritas Lokasi & Anti-Mock GPS
  if (isMocked) {
    return {
      canCheckIn: false,
      statusType: 'mock_gps',
      message: 'Lokasi tiruan (Fake GPS) terdeteksi. Harap matikan aplikasi lokasi palsu perangkat Anda.',
    };
  }

  // BR-02: Integritas Geofencing Radius
  if (!isWithinRadius) {
    const distText = distanceMeters !== undefined ? `${Math.round(distanceMeters)}m` : 'belum diketahui';
    return {
      canCheckIn: false,
      statusType: 'outside_radius',
      message: `Anda berada di luar radius laboratorium (Jarak: ${distText} / Radius aman: ${radiusMeters}m). Harap mendekat ke lab.`,
    };
  }

  return {
    canCheckIn: true,
    statusType: 'ready',
    message: 'Posisi Anda terverifikasi di dalam radius laboratorium. Silakan lakukan presensi sekarang.',
  };
}

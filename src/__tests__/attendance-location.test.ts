import { evaluateAttendanceGuard } from '@/features/praktikan/attendance-guard';
import { validateCheckInLocation } from '@/services/attendance-location';
import { mockDataService } from '@/services/mock';
import { calculateDistanceHaversine, isCoordinateInRadius } from '@/services/mock/geofence-stub';
import type { PracticumSession } from '@/types/domain';

// Koordinat Lab RPL Informatika Undip: -7.049821, 110.439120
const LAB_RPL_COORD = { latitude: -7.049821, longitude: 110.43912 };
const INSIDE_COORD = { latitude: -7.049815, longitude: 110.439115 }; // Jarak ~0.8m s/d ~6m
const OUTSIDE_COORD = { latitude: -7.051, longitude: 110.441 }; // Jarak >150m

const createMockSession = (status: 'belum-dibuka' | 'berlangsung' | 'selesai' = 'berlangsung'): PracticumSession => ({
  id: 'ses-test-1',
  classId: 'cls-test-a',
  courseName: 'Praktikum Pemrograman Mobile',
  classGroup: 'Kelas A',
  room: 'Lab RPL (Gedung E)',
  laboratoryId: 'lab-rpl',
  latitude: LAB_RPL_COORD.latitude,
  longitude: LAB_RPL_COORD.longitude,
  radius: 50,
  qrCodeSecret: 'secret_123',
  dayLabel: 'Senin',
  dateLabel: '24 November 2026',
  startTime: '08:00',
  endTime: '10:00',
  asprakName: 'Johan R.',
  status,
  participants: [
    {
      id: 'p1',
      classId: 'cls-test-a',
      name: 'Muhammad Hafidz',
      nim: '24060122140001',
    },
    {
      id: 'p2',
      classId: 'cls-test-a',
      name: 'Peserta Lain',
      nim: '24060122140002',
      checkInAt: '08:05',
    },
  ],
});

describe('Geofencing Haversine Calculator', () => {
  it('menghitung jarak 0 meter untuk koordinat yang identik', () => {
    const dist = calculateDistanceHaversine(LAB_RPL_COORD, LAB_RPL_COORD);
    expect(dist).toBe(0);
  });

  it('mengidentifikasi titik berada di dalam radius 50m', () => {
    const inRadius = isCoordinateInRadius(INSIDE_COORD, LAB_RPL_COORD, 50);
    expect(inRadius).toBe(true);
  });

  it('mengidentifikasi titik berada di luar radius 50m', () => {
    const inRadius = isCoordinateInRadius(OUTSIDE_COORD, LAB_RPL_COORD, 50);
    expect(inRadius).toBe(false);
  });
});

describe('Validasi Presensi Lokasi (validateCheckInLocation)', () => {
  const session = createMockSession('berlangsung');
  const participant = session.participants[0];

  it('sukses presensi saat posisi di dalam radius lab (<50m)', () => {
    const result = validateCheckInLocation(session, participant, {
      sessionId: session.id,
      participantId: participant.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: false },
    });

    expect(result.valid).toBe(true);
    expect(result.audit).toBeDefined();
    expect(result.audit?.status).toBe('hadir');
    expect(result.audit?.distanceMeters).toBeLessThanOrEqual(50);
    expect(result.audit?.verificationMethod).toBe('geofence');
  });

  it('gagal presensi jika pengguna berada di luar radius (>50m) - BR-02', () => {
    const result = validateCheckInLocation(session, participant, {
      sessionId: session.id,
      participantId: participant.id,
      userCoordinates: { ...OUTSIDE_COORD, isMocked: false },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain('di luar radius laboratorium');
  });

  it('gagal presensi jika sesi belum dibuka - BR-01', () => {
    const closedSession = createMockSession('belum-dibuka');
    const result = validateCheckInLocation(closedSession, participant, {
      sessionId: closedSession.id,
      participantId: participant.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: false },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Sesi belum dibuka oleh asisten praktikum.');
  });

  it('gagal presensi jika sesi sudah selesai - BR-01', () => {
    const finishedSession = createMockSession('selesai');
    const result = validateCheckInLocation(finishedSession, participant, {
      sessionId: finishedSession.id,
      participantId: participant.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: false },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Sesi sudah ditutup, presensi tidak dapat dilakukan.');
  });

  it('gagal presensi ganda jika sudah hadir - BR-03', () => {
    const alreadyPresent = session.participants[1];
    const result = validateCheckInLocation(session, alreadyPresent, {
      sessionId: session.id,
      participantId: alreadyPresent.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: false },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Presensi untuk sesi ini sudah tercatat.');
  });

  it('menolak lokasi palsu (Fake GPS) - BR-04', () => {
    const result = validateCheckInLocation(session, participant, {
      sessionId: session.id,
      participantId: participant.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: true },
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Lokasi palsu terdeteksi. Harap matikan aplikasi Fake GPS.');
  });

  it('sukses presensi QR Code jika kode benar dan dalam radius - FR-34', () => {
    const result = validateCheckInLocation(session, participant, {
      sessionId: session.id,
      participantId: participant.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: false },
      verificationMethod: 'qr_geofence',
      qrCodeSecret: 'secret_123',
    });

    expect(result.valid).toBe(true);
    expect(result.audit?.verificationMethod).toBe('qr_geofence');
  });

  it('gagal presensi QR Code jika token salah', () => {
    const result = validateCheckInLocation(session, participant, {
      sessionId: session.id,
      participantId: participant.id,
      userCoordinates: { ...INSIDE_COORD, isMocked: false },
      verificationMethod: 'qr_geofence',
      qrCodeSecret: 'wrong_secret',
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('Kode QR tidak valid atau sudah kadaluwarsa.');
  });
});

describe('Attendance Guard (evaluateAttendanceGuard)', () => {
  const session = createMockSession('berlangsung');
  const participant = session.participants[0];

  it('menolak presensi jika status offline - BR-10', () => {
    const guard = evaluateAttendanceGuard({
      session,
      participant,
      isOnline: false,
      isWithinRadius: true,
    });

    expect(guard.canCheckIn).toBe(false);
    expect(guard.statusType).toBe('offline');
  });

  it('mengizinkan presensi jika seluruh syarat terpenuhi', () => {
    const guard = evaluateAttendanceGuard({
      session,
      participant,
      isOnline: true,
      isWithinRadius: true,
      isMocked: false,
      distanceMeters: 12,
      radiusMeters: 50,
    });

    expect(guard.canCheckIn).toBe(true);
    expect(guard.statusType).toBe('ready');
  });
});

describe('Mock DataService checkInWithLocation Integration', () => {
  it('berhasil memanggil mockDataService.checkInWithLocation jika di dalam lab', async () => {
    if (mockDataService.checkInWithLocation) {
      const res = await mockDataService.checkInWithLocation({
        sessionId: 'ses-mobile-2',
        participantId: 'p1',
        userCoordinates: { ...INSIDE_COORD, isMocked: false },
      });
      expect(res.ok).toBe(true);
    }
  });
});

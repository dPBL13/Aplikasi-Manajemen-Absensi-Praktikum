import { getLaboratoryById } from '@/data/seed-labs';
import type {
  AttendanceAuditRecord,
  AttendanceVerificationMethod,
  GeofenceCoordinate,
  PracticumSession,
  SessionParticipant,
} from '@/types/domain';
import { validateGeofence } from './mock/geofence-stub';
import type { MutationResult } from './types';

export interface CheckInLocationInput {
  sessionId: string;
  participantId?: string;
  nim?: string;
  name?: string;
  userCoordinates: GeofenceCoordinate & {
    accuracy?: number;
    isMocked?: boolean;
  };
  verificationMethod?: AttendanceVerificationMethod;
  qrCodeSecret?: string;
  deviceInfo?: string;
}

export type CheckInLocationResult = MutationResult & {
  audit?: AttendanceAuditRecord;
};

/**
 * Validasi murni bisnis dan geofencing untuk presensi berbasis lokasi (Sprint 3, FR-28).
 * Menegakkan BR-01, BR-02, BR-03, BR-04, dan BR-05.
 */
export function validateCheckInLocation(
  session: PracticumSession,
  participant: SessionParticipant | undefined,
  input: CheckInLocationInput,
): { valid: boolean; reason?: string; audit?: AttendanceAuditRecord } {
  // BR-01: Kondisi Keabsahan Sesi
  if (session.status === 'belum-dibuka') {
    return { valid: false, reason: 'Sesi belum dibuka oleh asisten praktikum.' };
  }
  if (session.status === 'selesai') {
    return { valid: false, reason: 'Sesi sudah ditutup, presensi tidak dapat dilakukan.' };
  }

  // Peserta terdaftar
  if (!participant) {
    return { valid: false, reason: 'Anda tidak terdaftar pada sesi ini.' };
  }

  // BR-03: Anti-Presensi Ganda (Idempotensi)
  if (participant.checkInAt) {
    return { valid: false, reason: 'Presensi untuk sesi ini sudah tercatat.' };
  }

  // BR-04: Integritas Lokasi & Anti-Mock GPS
  if (input.userCoordinates.isMocked) {
    return {
      valid: false,
      reason: 'Lokasi palsu terdeteksi. Harap matikan aplikasi Fake GPS.',
    };
  }

  // FR-34: Validasi QR Code Secret jika metode qr_geofence
  if (input.verificationMethod === 'qr_geofence') {
    if (session.qrCodeSecret && input.qrCodeSecret !== session.qrCodeSecret) {
      return {
        valid: false,
        reason: 'Kode QR tidak valid atau sudah kadaluwarsa.',
      };
    }
  }

  // Koordinat lab target
  const lab = getLaboratoryById(session.laboratoryId);
  const targetLabCoord: GeofenceCoordinate = {
    latitude: session.latitude ?? lab.latitude,
    longitude: session.longitude ?? lab.longitude,
  };
  const radius = session.radius ?? lab.radius ?? 50;

  // BR-02: Kalkulasi Haversine & Validasi Radius Geofencing
  const geofenceResult = validateGeofence(input.userCoordinates, targetLabCoord, radius);

  if (!geofenceResult.isWithinRadius) {
    const diff = Math.round(geofenceResult.distanceMeters - radius);
    return {
      valid: false,
      reason: `Gagal presensi: Anda berada ${Math.round(geofenceResult.distanceMeters)} meter di luar radius laboratorium (${radius} meter, selisih ${diff}m).`,
    };
  }

  // BR-05: Metadata Audit Kehadiran
  const audit: AttendanceAuditRecord = {
    sessionId: session.id,
    participantId: participant.id,
    nim: participant.nim,
    name: participant.name,
    checkInAt: new Date().toISOString(),
    status: 'hadir',
    latitude: input.userCoordinates.latitude,
    longitude: input.userCoordinates.longitude,
    distanceMeters: geofenceResult.distanceMeters,
    isWithinRadius: true,
    verificationMethod: input.verificationMethod ?? 'geofence',
    deviceInfo: input.deviceInfo,
  };

  return { valid: true, audit };
}

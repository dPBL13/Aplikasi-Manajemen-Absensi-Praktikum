import type { GeofenceCoordinate, GeofenceValidationResult } from '@/types/domain';
import { calculateDistanceHaversine, isCoordinateInRadius } from '@/utils/haversine';

/**
 * KONTRAK GEOFENCING (JH-02) — dikonsumsi modul presensi (HF) dan peta (JH).
 * Tidak memiliki state dan tidak menyentuh data presensi.
 */

export { calculateDistanceHaversine, isCoordinateInRadius };

/** SRS §7: di atas ambang ini tampilkan "Akurasi GPS rendah". */
export const GPS_ACCURACY_WARN_METERS = 30;
/** SRS §7: tombol presensi menunggu hingga akurasi di bawah ambang ini. */
export const GPS_ACCURACY_READY_METERS = 20;

/** Bentuk minimum dari `expo-location` `LocationObject` yang dibutuhkan kalkulator. */
export interface DeviceLocationLike {
  coords: { latitude: number; longitude: number; accuracy?: number | null };
  /** Android: true bila berasal dari mock provider. iOS: undefined. */
  mocked?: boolean | null;
}

/**
 * BR-04: deteksi lokasi palsu. Hanya bergantung pada flag `mocked` dari OS;
 * iOS tidak menyediakan flag ini sehingga hasilnya selalu `false` di sana.
 */
export function detectMockLocation(location: Pick<DeviceLocationLike, 'mocked'>): boolean {
  return location.mocked === true;
}

/** true bila akurasi cukup baik untuk memvalidasi presensi (< 20 m). */
export function isAccuracyReady(accuracy: number): boolean {
  return Number.isFinite(accuracy) && accuracy < GPS_ACCURACY_READY_METERS;
}

/** true bila akurasi buruk dan UI perlu menampilkan peringatan (> 30 m). */
export function isAccuracyPoor(accuracy: number): boolean {
  return !Number.isFinite(accuracy) || accuracy > GPS_ACCURACY_WARN_METERS;
}

/** Validasi satu posisi perangkat terhadap geofence (kontrak SRS §10.2). */
export function validateGeofence(
  device: DeviceLocationLike,
  center: GeofenceCoordinate,
  radiusMeters: number,
): GeofenceValidationResult {
  const distanceMeters = calculateDistanceHaversine(device.coords, center);

  return {
    distanceMeters,
    isWithinRadius: distanceMeters <= radiusMeters,
    accuracy: device.coords.accuracy ?? Number.POSITIVE_INFINITY,
    isMocked: detectMockLocation(device),
  };
}

/**
 * Selisih ke batas aman, untuk petunjuk edge case "50,1 m": positif = masih
 * berada di luar radius sejauh itu; nol/negatif = sudah di dalam.
 */
export function metersOutsideRadius(distanceMeters: number, radiusMeters: number): number {
  return Math.max(0, distanceMeters - radiusMeters);
}

/** Bentuk objek yang dipakai HF (`GeofencingCalculator`) — satu pintu masuk. */
export const geofenceCalculator = {
  calculateDistance: calculateDistanceHaversine,
  isWithinRadius: isCoordinateInRadius,
  validate: validateGeofence,
  detectMockLocation,
  isAccuracyReady,
  isAccuracyPoor,
  metersOutsideRadius,
} as const;

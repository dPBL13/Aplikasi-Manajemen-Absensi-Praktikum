import type { GeofenceCoordinate } from '@/types/domain';

/**
 * Kalkulator jarak lingkaran besar (Haversine) — JH-02.
 * Fungsi murni tanpa dependency React/Expo agar mudah diuji dan dipakai ulang
 * oleh modul presensi (HF) melalui `src/services/geofence-calculator.ts`.
 *
 * Akurasi: bumi dimodelkan sebagai bola (R rata-rata IUGG). Selisih terhadap
 * elipsoid WGS84 ≤ ~0,5%, yaitu < 0,3 m untuk radius 50 m — di bawah ambang
 * deviasi 3 m pada FR-28.
 */

/** Jari-jari rata-rata bumi (IUGG), meter. */
export const EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** true bila koordinat berupa angka hingga dan berada di rentang WGS84. */
export function isValidCoordinate(point: GeofenceCoordinate): boolean {
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180
  );
}

/**
 * Jarak antara dua koordinat dalam meter.
 * Melempar `RangeError` bila salah satu koordinat tidak valid, agar bug data
 * tidak diam-diam menghasilkan `NaN` yang lolos sebagai "di luar radius".
 */
export function calculateDistanceHaversine(
  from: GeofenceCoordinate,
  to: GeofenceCoordinate,
): number {
  if (!isValidCoordinate(from) || !isValidCoordinate(to)) {
    throw new RangeError('Koordinat tidak valid untuk perhitungan Haversine.');
  }

  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  // min(1, …) menahan galat pembulatan floating point di dekat titik antipodal.
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));

  return EARTH_RADIUS_METERS * Math.min(Math.PI, c);
}

/** BR-02: jarak ≤ radius (inklusif di garis batas). */
export function isCoordinateInRadius(
  point: GeofenceCoordinate,
  center: GeofenceCoordinate,
  radiusMeters: number,
): boolean {
  return calculateDistanceHaversine(point, center) <= radiusMeters;
}

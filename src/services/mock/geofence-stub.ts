import type { GeofenceCoordinate, GeofenceValidationResult } from '@/types/domain';

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Menghitung jarak lingkaran besar (great-circle distance) antara dua koordinat
 * menggunakan formula Haversine dengan presisi tingkat meter.
 */
export function calculateDistanceHaversine(
  coord1: GeofenceCoordinate,
  coord2: GeofenceCoordinate,
): number {
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLng = toRadians(coord2.longitude - coord1.longitude);

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_METERS * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Mengecek apakah koordinat pengguna berada dalam radius toleransi titik pusat.
 */
export function isCoordinateInRadius(
  userCoord: GeofenceCoordinate,
  centerCoord: GeofenceCoordinate,
  radiusMeters: number,
): boolean {
  const distance = calculateDistanceHaversine(userCoord, centerCoord);
  return distance <= radiusMeters;
}

/**
 * Melakukan validasi menyeluruh geofencing dan mengecek flag mock location.
 */
export function validateGeofence(
  userCoord: GeofenceCoordinate & { accuracy?: number; isMocked?: boolean },
  targetLabCoord: GeofenceCoordinate,
  radiusMeters = 50,
): GeofenceValidationResult {
  const distance = calculateDistanceHaversine(userCoord, targetLabCoord);
  const isWithin = distance <= radiusMeters;

  return {
    distanceMeters: distance,
    isWithinRadius: isWithin,
    accuracy: userCoord.accuracy ?? 5,
    isMocked: Boolean(userCoord.isMocked),
  };
}

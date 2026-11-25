import { describe, expect, it } from '@jest/globals';

import {
  detectMockLocation,
  isAccuracyPoor,
  isAccuracyReady,
  metersOutsideRadius,
  validateGeofence,
} from '@/services/geofence-calculator';
import {
  EARTH_RADIUS_METERS,
  calculateDistanceHaversine,
  isCoordinateInRadius,
  isValidCoordinate,
} from '@/utils/haversine';

const LAB = { latitude: -7.049821, longitude: 110.43912 };

/** Geser titik ke utara sejauh `meters` (1° lintang ≈ R·π/180 meter). */
const northOf = (point: typeof LAB, meters: number) => ({
  latitude: point.latitude + (meters / EARTH_RADIUS_METERS) * (180 / Math.PI),
  longitude: point.longitude,
});

describe('calculateDistanceHaversine', () => {
  it('mengembalikan 0 untuk titik yang sama', () => {
    expect(calculateDistanceHaversine(LAB, LAB)).toBe(0);
  });

  it('1° bujur di khatulistiwa ≈ 111,195 km', () => {
    const d = calculateDistanceHaversine({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 });
    expect(d).toBeCloseTo(111_195.08, 0);
  });

  it('simetris (A→B = B→A)', () => {
    const b = { latitude: -6.2, longitude: 106.8 };
    expect(calculateDistanceHaversine(LAB, b)).toBeCloseTo(calculateDistanceHaversine(b, LAB), 6);
  });

  it('Semarang → Jakarta cocok dengan referensi Vincenty WGS84 (403.718 m) dalam 0,5%', () => {
    const semarang = { latitude: -6.9667, longitude: 110.4167 };
    const jakarta = { latitude: -6.2088, longitude: 106.8456 };
    const d = calculateDistanceHaversine(semarang, jakarta);
    expect(Math.abs(d - 403_718.047) / 403_718.047).toBeLessThan(0.005);
  });

  it('selisih terhadap elipsoid WGS84 < 3 m pada skala geofence (referensi Vincenty 49,757 m)', () => {
    const to = { latitude: LAB.latitude + 50 / 111_132, longitude: LAB.longitude };
    const d = calculateDistanceHaversine(LAB, to);
    expect(Math.abs(d - 49.757)).toBeLessThan(3);
  });

  it('akurat < 3 m pada skala geofence (SRS FR-28)', () => {
    for (const meters of [5, 20, 50, 120, 200]) {
      const d = calculateDistanceHaversine(LAB, northOf(LAB, meters));
      expect(Math.abs(d - meters)).toBeLessThan(0.01);
    }
  });

  it('tahan antipodal tanpa NaN', () => {
    const d = calculateDistanceHaversine(
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 180 },
    );
    expect(Number.isNaN(d)).toBe(false);
    expect(d).toBeCloseTo(Math.PI * EARTH_RADIUS_METERS, 0);
  });

  it('melempar RangeError untuk koordinat tidak valid', () => {
    expect(() => calculateDistanceHaversine({ latitude: 91, longitude: 0 }, LAB)).toThrow(RangeError);
    expect(() => calculateDistanceHaversine(LAB, { latitude: Number.NaN, longitude: 0 })).toThrow(
      RangeError,
    );
  });
});

describe('isValidCoordinate', () => {
  it('menerima batas rentang dan menolak di luar rentang', () => {
    expect(isValidCoordinate({ latitude: 90, longitude: 180 })).toBe(true);
    expect(isValidCoordinate({ latitude: -90, longitude: -180 })).toBe(true);
    expect(isValidCoordinate({ latitude: 90.0001, longitude: 0 })).toBe(false);
    expect(isValidCoordinate({ latitude: 0, longitude: Number.POSITIVE_INFINITY })).toBe(false);
  });
});

describe('isCoordinateInRadius (BR-02)', () => {
  it('di dalam radius → true', () => {
    expect(isCoordinateInRadius(northOf(LAB, 30), LAB, 50)).toBe(true);
  });

  it('di luar radius → false', () => {
    expect(isCoordinateInRadius(northOf(LAB, 50.5), LAB, 50)).toBe(false);
  });

  it('tepat di garis batas dianggap di dalam (inklusif)', () => {
    const d = calculateDistanceHaversine(LAB, northOf(LAB, 50));
    expect(isCoordinateInRadius(northOf(LAB, 50), LAB, d)).toBe(true);
  });
});

describe('geofence-calculator', () => {
  const device = (meters: number, extra: { accuracy?: number | null; mocked?: boolean | null } = {}) => ({
    coords: { ...northOf(LAB, meters), accuracy: extra.accuracy ?? 8 },
    mocked: extra.mocked,
  });

  it('validateGeofence: di dalam radius', () => {
    const r = validateGeofence(device(20), LAB, 50);
    expect(r.isWithinRadius).toBe(true);
    expect(r.distanceMeters).toBeCloseTo(20, 1);
    expect(r.isMocked).toBe(false);
    expect(r.accuracy).toBe(8);
  });

  it('validateGeofence: di luar radius', () => {
    const r = validateGeofence(device(80), LAB, 50);
    expect(r.isWithinRadius).toBe(false);
    expect(metersOutsideRadius(r.distanceMeters, 50)).toBeCloseTo(30, 1);
  });

  it('akurasi tidak dilaporkan → Infinity (dianggap belum siap)', () => {
    const r = validateGeofence({ coords: { ...LAB, accuracy: null } }, LAB, 50);
    expect(r.accuracy).toBe(Number.POSITIVE_INFINITY);
    expect(isAccuracyReady(r.accuracy)).toBe(false);
    expect(isAccuracyPoor(r.accuracy)).toBe(true);
  });

  it('detectMockLocation hanya true bila flag mocked === true (BR-04)', () => {
    expect(detectMockLocation({ mocked: true })).toBe(true);
    expect(detectMockLocation({ mocked: false })).toBe(false);
    expect(detectMockLocation({ mocked: null })).toBe(false);
    expect(detectMockLocation({})).toBe(false); // iOS: flag tidak tersedia
    expect(validateGeofence(device(5, { mocked: true }), LAB, 50).isMocked).toBe(true);
  });

  it('ambang akurasi sesuai SRS §7 (<20 siap, >30 buruk)', () => {
    expect(isAccuracyReady(19.9)).toBe(true);
    expect(isAccuracyReady(20)).toBe(false);
    expect(isAccuracyPoor(30)).toBe(false);
    expect(isAccuracyPoor(30.1)).toBe(true);
  });

  it('metersOutsideRadius tidak pernah negatif', () => {
    expect(metersOutsideRadius(10, 50)).toBe(0);
    expect(metersOutsideRadius(51, 50)).toBe(1);
  });
});

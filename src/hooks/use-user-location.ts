import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { GeofenceCoordinate } from '@/types/domain';

/**
 * Live tracking posisi pengguna (JH-05, FR-30) — hanya foreground.
 *
 * - Subscription `watchPositionAsync` dibatasi ≥ 3000 ms / ≥ 5 m (NFR §8.4).
 * - Berhenti otomatis saat layar kehilangan fokus / unmount (SRS §7 Baterai).
 * - Timeout pencarian sinyal > 10 dtk → status `timeout` + `retry()` (FR-33.4).
 *
 * STUB RULE: izin diminta langsung lewat `expo-location` karena
 * `DevicePermissionService` (YG-02) belum tersedia. Ganti blok `permissionGateway`
 * di bawah saat YG-02 merge; bentuk hook tidak berubah.
 */

export type UserLocationStatus =
  | 'idle'
  | 'requesting'
  | 'tracking'
  | 'denied'
  | 'blocked' // ditolak permanen: arahkan ke Pengaturan OS
  | 'gps-off'
  | 'timeout'
  | 'error';

export interface UserLocationFix {
  coordinate: GeofenceCoordinate;
  /** Akurasi horizontal (m); null bila tidak dilaporkan. */
  accuracy: number | null;
  heading: number | null;
  /** Android: true bila lokasi berasal dari mock provider (BR-04). */
  isMocked: boolean;
  timestamp: number;
}

export interface UseUserLocationOptions {
  /** Default true. Set false untuk menunda tracking (mis. sebelum dialog edukasi izin). */
  enabled?: boolean;
}

export interface UseUserLocationResult {
  status: UserLocationStatus;
  location: UserLocationFix | null;
  /** Ulangi alur izin → cek GPS → watch (setelah timeout/GPS dinyalakan). */
  retry: () => void;
}

const FIRST_FIX_TIMEOUT_MS = 10_000;
const WATCH_TIME_INTERVAL_MS = 3_000;
const WATCH_DISTANCE_INTERVAL_M = 5;

/** Satu-satunya bagian yang diganti ketika YG-02 tersedia. */
const permissionGateway = {
  async ensureForeground(): Promise<'granted' | 'denied' | 'blocked'> {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.granted) return 'granted';
    if (!current.canAskAgain) return 'blocked';

    const requested = await Location.requestForegroundPermissionsAsync();
    if (requested.granted) return 'granted';
    return requested.canAskAgain ? 'denied' : 'blocked';
  },
  isLocationServicesEnabled: () => Location.hasServicesEnabledAsync(),
};

function toFix(position: Location.LocationObject): UserLocationFix {
  return {
    coordinate: { latitude: position.coords.latitude, longitude: position.coords.longitude },
    accuracy: position.coords.accuracy ?? null,
    heading:
      typeof position.coords.heading === 'number' && position.coords.heading >= 0
        ? position.coords.heading
        : null,
    isMocked: position.mocked === true,
    timestamp: position.timestamp,
  };
}

export function useUserLocation({ enabled = true }: UseUserLocationOptions = {}): UseUserLocationResult {
  const [status, setStatus] = useState<UserLocationStatus>('idle');
  const [location, setLocation] = useState<UserLocationFix | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [focused, setFocused] = useState(false);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Tracking hanya saat layar fokus (tab berpindah / push layar lain = berhenti).
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (!enabled || !focused) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const start = async () => {
      setStatus('requesting');

      try {
        const permission = await permissionGateway.ensureForeground();
        if (cancelled) return;
        if (permission !== 'granted') {
          setStatus(permission);
          return;
        }

        if (!(await permissionGateway.isLocationServicesEnabled())) {
          if (!cancelled) setStatus('gps-off');
          return;
        }

        timeoutId = setTimeout(() => {
          if (!cancelled) setStatus((previous) => (previous === 'requesting' ? 'timeout' : previous));
        }, FIRST_FIX_TIMEOUT_MS);

        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: WATCH_TIME_INTERVAL_MS,
            distanceInterval: WATCH_DISTANCE_INTERVAL_M,
          },
          (position) => {
            if (cancelled) return;
            if (timeoutId) clearTimeout(timeoutId);
            setLocation(toFix(position));
            setStatus('tracking');
          },
        );

        if (cancelled) {
          subscription.remove();
          return;
        }
        subscriptionRef.current = subscription;
      } catch {
        if (!cancelled) setStatus('error');
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [enabled, focused, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return { status, location, retry };
}

export type CurrentCoordinateResult =
  | { ok: true; coordinate: GeofenceCoordinate; accuracy: number | null; isMocked: boolean }
  | { ok: false; reason: string };

/**
 * Sekali baca posisi saat ini — untuk tombol "Gunakan Lokasi Saya Saat Ini"
 * pada form lab (FR-29.2). Mengembalikan pesan Indonesia siap tampil.
 */
export async function requestCurrentCoordinate(): Promise<CurrentCoordinateResult> {
  try {
    const permission = await permissionGateway.ensureForeground();
    if (permission === 'blocked') {
      return { ok: false, reason: 'Izin lokasi ditolak. Aktifkan lewat Pengaturan perangkat.' };
    }
    if (permission === 'denied') {
      return { ok: false, reason: 'Izin Lokasi Dibutuhkan untuk menggunakan lokasi saat ini.' };
    }
    if (!(await permissionGateway.isLocationServicesEnabled())) {
      return { ok: false, reason: 'Aktifkan GPS perangkat Anda untuk melanjutkan' };
    }

    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), FIRST_FIX_TIMEOUT_MS),
      ),
    ]);
    const fix = toFix(position);
    return { ok: true, coordinate: fix.coordinate, accuracy: fix.accuracy, isMocked: fix.isMocked };
  } catch (error) {
    return {
      ok: false,
      reason:
        error instanceof Error && error.message === 'timeout'
          ? 'Sinyal GPS belum ditemukan. Coba lagi.'
          : 'Tidak dapat membaca lokasi perangkat.',
    };
  }
}

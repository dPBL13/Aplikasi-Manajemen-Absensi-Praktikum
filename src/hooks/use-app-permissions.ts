// sprint 3

import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
    GPS_POLL_INTERVAL_MS,
    devicePermissionService as service,
    type PermissionKind,
    type PermissionState,
} from '@/services/device-permission';

type Statuses = Record<PermissionKind, PermissionState>;

const INITIAL: Statuses = {
  location: 'undetermined',
  notification: 'undetermined',
  camera: 'undetermined',
};

/**
 * Status izin + GPS untuk layar. Harus dipakai di dalam layar/navigator
 * (memakai useFocusEffect). Menyegarkan saat layar fokus dan saat aplikasi
 * kembali aktif (misalnya pulang dari Pengaturan).
 */
export function useAppPermissions() {
  const [statuses, setStatuses] = useState<Statuses>(INITIAL);
  const [gpsEnabled, setGpsEnabled] = useState<boolean | null>(null);
  const [ready, setReady] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const [location, notification, camera, gps] = await Promise.all([
      service.getStatus('location'),
      service.getStatus('notification'),
      service.getStatus('camera'),
      service.isLocationServiceEnabled(),
    ]);
    if (!mounted.current) return;
    setStatuses({ location, notification, camera });
    setGpsEnabled(gps);
    setReady(true);
  }, []);

  const refreshGps = useCallback(async () => {
    const enabled = await service.isLocationServiceEnabled();
    if (mounted.current) setGpsEnabled(enabled);
  }, []);

  // Saat layar fokus: segarkan sekali, lalu pantau GPS berkala (SRS: GPS dimatikan di layar presensi).
  useFocusEffect(
    useCallback(() => {
      void refresh();
      const id = setInterval(() => {
        if (AppState.currentState === 'active') void refreshGps();
      }, GPS_POLL_INTERVAL_MS);
      return () => clearInterval(id);
    }, [refresh, refreshGps]),
  );

  // Pengguna kembali dari Pengaturan OS.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const request = useCallback(async (kind: PermissionKind) => {
    const next = await service.request(kind);
    if (mounted.current) setStatuses((prev) => ({ ...prev, [kind]: next }));
    return next;
  }, []);

  return {
    ...statuses,
    gpsEnabled,
    ready,
    /** Izin lokasi diberikan DAN GPS menyala. */
    canUseLocation: statuses.location === 'granted' && gpsEnabled === true,
    refresh,
    request,
    openSettings: service.openSettings,
  };
}
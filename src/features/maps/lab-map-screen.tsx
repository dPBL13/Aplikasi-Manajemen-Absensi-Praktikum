import {
  Camera,
  Map,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import { Stack, router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { LabActivitySheet } from '@/components/maps/lab-activity-sheet';
import { LabMarker } from '@/components/maps/lab-marker';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useUserLocation, type UserLocationStatus } from '@/hooks/use-user-location';
import { useLaboratories } from '@/services/laboratory';
import { calculateDistanceHaversine } from '@/services/geofence-calculator';
import type { Laboratory, PracticumSession } from '@/types/domain';

/** URL tile OpenStreetMap — tidak butuh API key (FR-30.1). */
const OSM_STYLE_URL = 'https://demotiles.maplibre.org/style.json';

/** Titik awal: Departemen Informatika FSM Undip (SRS FR-30.1). */
const INITIAL_CENTER: [number, number] = [110.4391, -7.0498]; // [lng, lat]
const INITIAL_ZOOM = 15;

const STATUS_MESSAGE: Partial<Record<UserLocationStatus, string>> = {
  denied: 'Izin lokasi dibutuhkan untuk menampilkan posisi Anda di peta.',
  blocked: 'Izin Lokasi Dibutuhkan untuk Melakukan Presensi',
  'gps-off': 'Aktifkan GPS perangkat Anda untuk melanjutkan',
  timeout: 'Sinyal GPS belum ditemukan. Coba lagi.',
  error: 'Tidak dapat membaca lokasi perangkat.',
};

/**
 * Peta laboratorium interaktif (JH-04/05/06/07, FR-30/FR-31).
 * Menggunakan @maplibre/maplibre-react-native — tidak butuh Google Maps API key.
 * Dipakai oleh `/maps` (shared) dan tab "Peta Lab" praktikan.
 */
export function LabMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const labs = useLaboratories();
  const { status, location, retry } = useUserLocation();

  const cameraRef = useRef<CameraRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => labs.find((lab) => lab.id === selectedId) ?? null, [labs, selectedId]);

  const distanceToSelected = useMemo(
    () => (selected && location ? calculateDistanceHaversine(location.coordinate, selected) : null),
    [selected, location],
  );

  const focusLabs = useCallback(() => {
    if (labs.length === 0) {
      cameraRef.current?.easeTo({ center: INITIAL_CENTER, zoom: INITIAL_ZOOM, duration: 400 });
      return;
    }
    if (labs.length === 1) {
      cameraRef.current?.easeTo({
        center: [labs[0].longitude, labs[0].latitude],
        zoom: 16,
        duration: 400,
      });
      return;
    }
    const lngs = labs.map((l) => l.longitude);
    const lats = labs.map((l) => l.latitude);
    cameraRef.current?.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      { padding: { top: 120, right: 60, bottom: 160, left: 60 }, duration: 400 },
    );
  }, [labs]);

  const recenter = useCallback(() => {
    if (!location) return;
    cameraRef.current?.easeTo({
      center: [location.coordinate.longitude, location.coordinate.latitude],
      zoom: 17,
      duration: 400,
    });
  }, [location]);

  const openSession = useCallback(
    (session: PracticumSession) => {
      setSelectedId(null);
      router.push(
        role === 'asprak'
          ? { pathname: '/asprak/session/[id]', params: { id: session.id } }
          : { pathname: '/praktikan/session/[id]', params: { id: session.id } },
      );
    },
    [role],
  );

  const onSelectLab = useCallback((lab: Laboratory) => {
    setSelectedId(lab.id);
    cameraRef.current?.easeTo({
      center: [lab.longitude, lab.latitude],
      zoom: 17,
      duration: 350,
    });
  }, []);

  const banner = STATUS_MESSAGE[status];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Peta Laboratorium' }} />

      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={OSM_STYLE_URL}
        onPress={() => setSelectedId(null)}>
        <Camera
          ref={cameraRef}
          initialViewState={{ center: INITIAL_CENTER, zoom: INITIAL_ZOOM }}
        />

        {/* Marker lokasi pengguna (bawaan MapLibre) */}
        <UserLocation animated />

        {/* Marker setiap laboratorium */}
        {labs.map((lab) => (
          <LabMarker key={lab.id} lab={lab} selected={lab.id === selectedId} onPress={onSelectLab} />
        ))}
      </Map>

      {banner ? (
        <View
          accessibilityLiveRegion="polite"
          style={[
            styles.banner,
            {
              top: Spacing.three,
              backgroundColor: theme.dangerBackground,
              borderColor: theme.dangerBorder,
            },
          ]}>
          <ThemedText type="bodySm" themeColor="onSurface">
            {banner}
          </ThemedText>
          {status === 'blocked' ? (
            <ActionButton label="Buka Pengaturan Perangkat" onPress={() => void Linking.openSettings()} />
          ) : null}
          {status === 'timeout' || status === 'gps-off' || status === 'denied' || status === 'error' ? (
            <ActionButton label="Coba Lagi" tone="secondary" onPress={retry} />
          ) : null}
        </View>
      ) : null}

      <View style={[styles.controls, { bottom: Spacing.three + insets.bottom }]}>
        <ActionButton label="Fokus ke Laboratorium" tone="secondary" onPress={focusLabs} />
        <ActionButton
          label="Pusatkan ke Lokasi Saya"
          onPress={recenter}
          disabled={!location}
        />
      </View>

      <LabActivitySheet
        lab={selected}
        distanceMeters={distanceToSelected}
        onClose={() => setSelectedId(null)}
        onOpenSession={openSession}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  banner: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  controls: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    gap: Spacing.two,
  },
});

import { Stack, router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { GeofenceCircle } from '@/components/maps/geofence-circle';
import { LabActivitySheet } from '@/components/maps/lab-activity-sheet';
import { LabMarker } from '@/components/maps/lab-marker';
import { UserLocationMarker } from '@/components/maps/user-location-marker';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useUserLocation, type UserLocationStatus } from '@/hooks/use-user-location';
import { useLaboratories } from '@/services/laboratory';
import { calculateDistanceHaversine, isCoordinateInRadius } from '@/services/geofence-calculator';
import type { Laboratory, PracticumSession } from '@/types/domain';

/** Titik awal: Departemen Informatika FSM Undip (SRS FR-30.1). */
const INFORMATIKA_UNDIP_REGION: Region = {
  latitude: -7.0498,
  longitude: 110.4391,
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

const STATUS_MESSAGE: Partial<Record<UserLocationStatus, string>> = {
  denied: 'Izin lokasi dibutuhkan untuk menampilkan posisi Anda di peta.',
  blocked: 'Izin Lokasi Dibutuhkan untuk Melakukan Presensi',
  'gps-off': 'Aktifkan GPS perangkat Anda untuk melanjutkan',
  timeout: 'Sinyal GPS belum ditemukan. Coba lagi.',
  error: 'Tidak dapat membaca lokasi perangkat.',
};

/**
 * Peta laboratorium interaktif (JH-04/05/06/07, FR-30/FR-31).
 * Dipakai oleh `/maps` (shared) dan tab "Peta Lab" praktikan.
 */
export function LabMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const labs = useLaboratories();
  const { status, location, retry } = useUserLocation();

  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => labs.find((lab) => lab.id === selectedId) ?? null, [labs, selectedId]);

  const distanceToSelected = useMemo(
    () => (selected && location ? calculateDistanceHaversine(location.coordinate, selected) : null),
    [selected, location],
  );
  const userInsideSelected = useMemo(
    () =>
      selected && location
        ? isCoordinateInRadius(location.coordinate, selected, selected.radius)
        : undefined,
    [selected, location],
  );

  const focusLabs = useCallback(() => {
    if (labs.length === 0) {
      mapRef.current?.animateToRegion(INFORMATIKA_UNDIP_REGION, 400);
      return;
    }
    mapRef.current?.fitToCoordinates(
      labs.map((lab) => ({ latitude: lab.latitude, longitude: lab.longitude })),
      { edgePadding: { top: 120, right: 60, bottom: 160, left: 60 }, animated: true },
    );
  }, [labs]);

  const recenter = useCallback(() => {
    if (!location) return;
    mapRef.current?.animateToRegion(
      { ...location.coordinate, latitudeDelta: 0.002, longitudeDelta: 0.002 },
      400,
    );
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
    mapRef.current?.animateToRegion(
      { latitude: lab.latitude, longitude: lab.longitude, latitudeDelta: 0.0025, longitudeDelta: 0.0025 },
      350,
    );
  }, []);

  const banner = STATUS_MESSAGE[status];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Peta Laboratorium' }} />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={INFORMATIKA_UNDIP_REGION}
        showsCompass
        toolbarEnabled={false}
        onPress={() => setSelectedId(null)}>
        {labs.map((lab) => (
          <LabMarker key={lab.id} lab={lab} selected={lab.id === selectedId} onPress={onSelectLab} />
        ))}
        {selected ? <GeofenceCircle lab={selected} isUserInside={userInsideSelected} /> : null}
        {location ? <UserLocationMarker fix={location} /> : null}
      </MapView>

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

import { Camera, Map as MapLibreMap, type CameraRef } from '@maplibre/maplibre-react-native';
import { Stack, router } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton } from '@/components/action-button';
import { GeofenceCircle } from '@/components/maps/geofence-circle';
import { LabActivitySheet } from '@/components/maps/lab-activity-sheet';
import { LabMarker } from '@/components/maps/lab-marker';
import { UserLocationMarker } from '@/components/maps/user-location-marker';
import {
  GpsDisabledDialog,
  PermissionBlockedBanner,
  PermissionPrimerDialog,
} from '@/components/notifications/permission-primer-dialog';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppPermissions } from '@/hooks/use-app-permissions';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useUserLocation, type UserLocationStatus } from '@/hooks/use-user-location';
import { GPS_DISABLED_COPY, PERMISSION_COPY } from '@/services/device-permission';
import { calculateDistanceHaversine, isCoordinateInRadius } from '@/services/geofence-calculator';
import { useLaboratories } from '@/services/laboratory';
import type { Laboratory, PracticumSession } from '@/types/domain';
import type React from 'react';

/** Style peta gratis tanpa API key (OpenFreeMap). Kredit "OpenFreeMap © OpenMapTiles, OpenStreetMap" wajib disebut di laporan. */
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Titik awal: Departemen Informatika FSM Undip (SRS FR-30.1). Urutan MapLibre: [lng, lat]. */
const INFORMATIKA_UNDIP_CENTER: [number, number] = [110.4391, -7.0498];
const DEFAULT_ZOOM = 17;
const LAB_ZOOM = 17.8;
const USER_ZOOM = 18.5;

const STATUS_MESSAGE: Partial<Record<UserLocationStatus, string>> = {
  denied: 'Izin lokasi dibutuhkan untuk menampilkan posisi Anda di peta.',
  blocked: 'Izin Lokasi Dibutuhkan untuk Melakukan Presensi',
  'gps-off': 'Aktifkan GPS perangkat Anda untuk melanjutkan',
  timeout: 'Sinyal GPS belum ditemukan. Coba lagi.',
  error: 'Tidak dapat membaca lokasi perangkat.',
};

/**
 * Peta laboratorium interaktif (JH-04/05/06/07, FR-30/FR-31) berbasis MapLibre.
 * Dipakai oleh `/maps` (shared) dan tab "Peta Lab" praktikan.
 */
export function LabMapScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const labs = useLaboratories();
  const permissions = useAppPermissions();

  const [primerDismissed, setPrimerDismissed] = useState(false);
  const [gpsDialogDismissed, setGpsDialogDismissed] = useState(false);

  const locationGranted = permissions.location === 'granted';
  const locationAskable =
    permissions.location === 'undetermined' || permissions.location === 'denied';
  const needsPrimer = permissions.ready && locationAskable && !primerDismissed;
  const gpsOff = permissions.ready && locationGranted && permissions.gpsEnabled === false;

  // Tracking hanya jalan setelah izin diberikan dan GPS menyala (dialog edukasi dulu, FR-33.1).
  const { status, location, retry } = useUserLocation({
    enabled: locationGranted && permissions.gpsEnabled !== false,
  });

  const cameraRef = useRef<CameraRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => labs.find((lab) => lab.id === selectedId) ?? null, [labs, selectedId]);

  // Marker terpilih dirender terakhir agar berada di atas.
  const orderedLabs = useMemo(
    () => [...labs].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId)),
    [labs, selectedId],
  );

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
      cameraRef.current?.easeTo({ center: INFORMATIKA_UNDIP_CENTER, zoom: DEFAULT_ZOOM, duration: 400 });
      return;
    }
    if (labs.length === 1) {
      cameraRef.current?.easeTo({
        center: [labs[0].longitude, labs[0].latitude],
        zoom: DEFAULT_ZOOM,
        duration: 400,
      });
      return;
    }
    const lngs = labs.map((lab) => lab.longitude);
    const lats = labs.map((lab) => lab.latitude);
    cameraRef.current?.fitBounds(
      [Math.min(...lngs), Math.min(...lats), Math.max(...lngs), Math.max(...lats)],
      { padding: { top: 120, right: 60, bottom: 160, left: 60 }, duration: 400 },
    );
  }, [labs]);

  const recenter = useCallback(() => {
    if (!location) return;
    cameraRef.current?.easeTo({
      center: [location.coordinate.longitude, location.coordinate.latitude],
      zoom: USER_ZOOM,
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
      zoom: LAB_ZOOM,
      duration: 350,
    });
  }, []);

  const hookBanner = STATUS_MESSAGE[status];
  const copy = PERMISSION_COPY.location;

  let bannerNode: React.ReactNode = null;
  if (permissions.location === 'blocked') {
    bannerNode = (
      <PermissionBlockedBanner kind="location" onOpenSettings={() => void permissions.openSettings()} />
    );
  } else if (permissions.ready && locationAskable && primerDismissed) {
    bannerNode = (
      <View
        accessibilityLiveRegion="polite"
        style={[styles.banner, { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder }]}>
        <ThemedText type="labelLg" style={{ color: theme.danger }}>
          {'⚠  '}
          {copy.deniedTitle}
        </ThemedText>
        <ActionButton label={copy.allowLabel} onPress={() => setPrimerDismissed(false)} />
      </View>
    );
  } else if (gpsOff) {
    bannerNode = (
      <View
        accessibilityLiveRegion="polite"
        style={[styles.banner, { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder }]}>
        <ThemedText type="labelLg" style={{ color: theme.danger }}>
          {'⚠  '}
          {GPS_DISABLED_COPY.title}
        </ThemedText>
        <ActionButton
          label={GPS_DISABLED_COPY.openSettingsLabel}
          onPress={() => void permissions.openSettings()}
        />
      </View>
    );
  } else if (hookBanner) {
    bannerNode = (
      <View
        accessibilityLiveRegion="polite"
        style={[styles.banner, { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder }]}>
        <ThemedText type="bodySm" themeColor="onSurface">
          {hookBanner}
        </ThemedText>
        {status === 'timeout' || status === 'error' ? (
          <ActionButton label="Coba Lagi" tone="secondary" onPress={retry} />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Stack.Screen options={{ title: 'Peta Laboratorium' }} />

      <MapLibreMap
        style={StyleSheet.absoluteFill}
        mapStyle={MAP_STYLE_URL}
        onPress={() => setSelectedId(null)}>
        <Camera
          ref={cameraRef}
          initialViewState={{ center: INFORMATIKA_UNDIP_CENTER, zoom: DEFAULT_ZOOM }}
        />
        {orderedLabs.map((lab) => (
          <LabMarker key={lab.id} lab={lab} selected={lab.id === selectedId} onPress={onSelectLab} />
        ))}
        {selected ? <GeofenceCircle lab={selected} isUserInside={userInsideSelected} /> : null}
        {location ? <UserLocationMarker fix={location} /> : null}
      </MapLibreMap>

      {bannerNode ? <View style={[styles.bannerSlot, { top: Spacing.three }]}>{bannerNode}</View> : null}

      <View style={[styles.controls, { bottom: Spacing.three + insets.bottom }]}>
        <ActionButton label="Fokus ke Laboratorium" tone="secondary" onPress={focusLabs} />
        <ActionButton label="Pusatkan ke Lokasi Saya" onPress={recenter} disabled={!location} />
      </View>

      <LabActivitySheet
        lab={selected}
        distanceMeters={distanceToSelected}
        onClose={() => setSelectedId(null)}
        onOpenSession={openSession}
      />

      <PermissionPrimerDialog
        visible={needsPrimer}
        kind="location"
        onAllow={() => {
          setPrimerDismissed(true);
          void permissions.request('location');
        }}
        onLater={() => setPrimerDismissed(true)}
      />
      <GpsDisabledDialog
        visible={gpsOff && !gpsDialogDismissed}
        onOpenSettings={() => void permissions.openSettings()}
        onClose={() => setGpsDialogDismissed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerSlot: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
  },
  banner: {
    width: '100%',
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
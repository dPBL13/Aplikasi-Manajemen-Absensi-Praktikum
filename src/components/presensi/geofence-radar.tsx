import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DistancePill } from './distance-pill';

interface GeofenceRadarProps {
  labName: string;
  roomName: string;
  distanceMeters?: number;
  radiusMeters?: number;
  accuracyMeters?: number;
  isWithinRadius: boolean;
  isMocked?: boolean;
}

/**
 * HF-02: Komponen Radar Status Geofencing.
 * Menampilkan animasi radar aktif, kalkulasi jarak GPS real-time ke lab,
 * akurasi satelit, dan status kesiapan radius.
 */
export function GeofenceRadar({
  labName,
  roomName,
  distanceMeters,
  radiusMeters = 50,
  accuracyMeters = 5,
  isWithinRadius,
  isMocked = false,
}: GeofenceRadarProps) {
  const theme = useTheme();

  // Animasi pulsing radar lingkaran
  const [pulseAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    pulseLoop.start();

    return () => pulseLoop.stop();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1.4],
  });

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.8, 0.4, 0],
  });

  const accuracyLabel =
    accuracyMeters <= 5
      ? 'Sangat Baik'
      : accuracyMeters <= 15
        ? 'Baik'
        : 'Sedang (Perlu kalibrasi GPS)';

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ThemedText type="labelLg" themeColor="onSurfaceSecondary">
          VERIFIKASI RADIUS & GEOLOKASI
        </ThemedText>
        <DistancePill
          distanceMeters={distanceMeters}
          radiusMeters={radiusMeters}
          isWithinRadius={isWithinRadius}
          labName={labName}
        />
      </View>

      {/* Visual Animasi Radar */}
      <View style={styles.radarContainer}>
        {/* Lingkaran luar animasi pulse */}
        <Animated.View
          style={[
            styles.radarWave,
            {
              backgroundColor: isWithinRadius ? theme.successBackground : theme.dangerBackground,
              borderColor: isWithinRadius ? theme.success : theme.dangerBorder,
              transform: [{ scale }],
              opacity,
            },
          ]}
        />
        {/* Titik tengah sentroid lab */}
        <View
          style={[
            styles.radarCenter,
            {
              backgroundColor: isWithinRadius ? theme.success : theme.danger,
              borderColor: theme.backgroundElement,
            },
          ]}>
          <ThemedText style={styles.radarIcon}>📡</ThemedText>
        </View>
      </View>

      <ThemedText type="headlineMd" themeColor="onSurface" style={styles.centerTitle}>
        {labName}
      </ThemedText>
      <ThemedText type="bodySm" themeColor="onSurfaceSecondary" style={styles.centerSubtitle}>
        {roomName}
      </ThemedText>

      {/* Informasi Detail Koordinat & Jarak */}
      <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt }]}>
        <View style={styles.infoRow}>
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Posisi Anda saat ini:
          </ThemedText>
          <ThemedText type="bodySm" themeColor="onSurface" style={styles.bold}>
            {distanceMeters !== undefined ? `${Math.round(distanceMeters)} meter dari lab` : 'Mencari sinyal GPS...'}
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Radius aman diizinkan:
          </ThemedText>
          <ThemedText type="bodySm" themeColor="onSurface" style={styles.bold}>
            {radiusMeters} meter
          </ThemedText>
        </View>

        <View style={styles.infoRow}>
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Akurasi sinyal GPS:
          </ThemedText>
          <ThemedText type="bodySm" themeColor="onSurface" style={styles.bold}>
            +/- {Math.round(accuracyMeters)}m ({accuracyLabel})
          </ThemedText>
        </View>
      </View>

      {/* Status Box Verifikasi */}
      <View
        style={[
          styles.statusBox,
          {
            backgroundColor: isWithinRadius ? theme.successBackground : theme.dangerBackground,
            borderColor: isWithinRadius ? theme.success : theme.dangerBorder,
          },
        ]}>
        <ThemedText
          type="labelLg"
          style={[styles.statusText, { color: isWithinRadius ? theme.success : theme.danger }]}>
          {isWithinRadius
            ? '[✓] Anda Berada di Dalam Radius Laboratorium'
            : `[✕] Anda Berada di Luar Radius Laboratorium (${distanceMeters !== undefined ? Math.round(distanceMeters) : 0}m / Maks ${radiusMeters}m)`}
        </ThemedText>
      </View>

      {isMocked ? (
        <View style={[styles.mockWarning, { backgroundColor: theme.dangerBackground, borderColor: theme.dangerBorder }]}>
          <ThemedText type="bodySm" style={{ color: theme.danger, fontWeight: '700' }}>
            ⚠️ Peringatan Integritas: Perangkat terdeteksi menggunakan Mock Provider (Fake GPS).
          </ThemedText>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  radarContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.one,
  },
  radarWave: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    borderWidth: 2,
  },
  radarCenter: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  radarIcon: {
    fontSize: 22,
  },
  centerTitle: {
    textAlign: 'center',
  },
  centerSubtitle: {
    textAlign: 'center',
    marginTop: -Spacing.one,
    marginBottom: Spacing.two,
  },
  infoBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bold: {
    fontWeight: '700',
  },
  statusBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.one,
  },
  statusText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  mockWarning: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.one,
  },
});

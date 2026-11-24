import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SessionParticipant } from '@/types/domain';

interface AttendanceAuditRowProps {
  participant: SessionParticipant;
  onPress?: () => void;
}

/**
 * HF-05 & FR-13: Baris audit kehadiran dengan verifikasi lokasi geofencing.
 * Ditampilkan pada layar rekap dan detail kehadiran Asisten Praktikum.
 */
export function AttendanceAuditRow({ participant, onPress }: AttendanceAuditRowProps) {
  const theme = useTheme();

  const isPresent = Boolean(participant.checkInAt);
  const distance = participant.distanceMeters;
  const method = participant.verificationMethod;

  const methodLabel =
    method === 'qr_geofence'
      ? 'QR Code + Geofence'
      : method === 'geofence'
        ? 'Geofence GPS'
        : 'Presensi Standar';

  return (
    <View style={[styles.row, { borderBottomColor: theme.border }]}>
      <View style={styles.left}>
        <ThemedText type="bodyMd" themeColor="onSurface" style={styles.name}>
          {participant.name}
        </ThemedText>
        <ThemedText type="monoSm" themeColor="onSurfaceSecondary">
          {participant.nim}
        </ThemedText>
      </View>

      <View style={styles.right}>
        {isPresent ? (
          <>
            <View style={[styles.badge, { backgroundColor: theme.successBackground, borderColor: theme.success }]}>
              <ThemedText type="labelSm" style={{ color: theme.success, fontWeight: '700' }}>
                ✓ {participant.checkInAt} WIB
              </ThemedText>
            </View>

            <ThemedText type="labelSm" themeColor="onSurfaceSecondary" style={styles.subDetail}>
              {distance !== undefined ? `${Math.round(distance)}m · ` : ''}{methodLabel}
            </ThemedText>
          </>
        ) : (
          <View style={[styles.badge, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            <ThemedText type="labelSm" themeColor="onSurfaceSecondary">
              Belum Hadir
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  subDetail: {
    fontSize: 10,
  },
});

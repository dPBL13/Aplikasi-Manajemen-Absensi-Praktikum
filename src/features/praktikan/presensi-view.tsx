import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { GeofenceRadar } from '@/components/presensi/geofence-radar';
import { QrScannerModal } from '@/components/presensi/qr-scanner-modal';
import { ScreenScroll } from '@/components/screen-scroll';
import { SessionStatusBadge } from '@/components/status-badge';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getLaboratoryById } from '@/data/seed-labs';
import { useTheme } from '@/hooks/use-theme';
import { dataService, useAppData } from '@/services';
import { calculateDistanceHaversine } from '@/services/mock/geofence-stub';
import { findSession, findSessionParticipant } from '@/services/selectors';
import type { GeofenceCoordinate } from '@/types/domain';
import { evaluateAttendanceGuard } from './attendance-guard';
import { useCurrentPraktikan } from './use-current-praktikan';

function calculateRemainingTime(endTime: string): string {
  const now = new Date();
  const [endH, endM] = endTime.split(':').map(Number);
  const targetTime = new Date();
  targetTime.setHours(endH, endM, 0, 0);

  const diffMs = targetTime.getTime() - now.getTime();
  if (diffMs <= 0) {
    return '00:00:00 (Waktu Habis)';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

interface PresensiViewProps {
  sessionId: string;
  onBack?: () => void;
}

type SimulationMode = 'inside' | 'outside' | 'mock_gps';

/**
 * HF-01 & US-01 (FR-27): Layar Khusus Presensi Mandiri Praktikan.
 * Halaman terpisah dari detail sesi dengan radar geofencing, countdown timer,
 * dan tombol presensi tervalidasi radius.
 */
export function PresensiView({ sessionId, onBack }: PresensiViewProps) {
  const theme = useTheme();
  const data = useAppData();
  const currentUser = useCurrentPraktikan();

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [busy, setBusy] = useState(false);
  const [simMode, setSimMode] = useState<SimulationMode>('inside');
  const [isQrModalVisible, setIsQrModalVisible] = useState(false);
  const [countdownText, setCountdownText] = useState<string>(() => {
    return '00:00:00';
  });

  const session = findSession(data, sessionId);
  const me = session
    ? findSessionParticipant(session, currentUser.id, currentUser.nim)
    : undefined;

  const targetLab = useMemo(() => {
    return getLaboratoryById(session?.laboratoryId);
  }, [session?.laboratoryId]);

  const labCoord: GeofenceCoordinate = useMemo(
    () => ({
      latitude: session?.latitude ?? targetLab.latitude,
      longitude: session?.longitude ?? targetLab.longitude,
    }),
    [session?.latitude, session?.longitude, targetLab.latitude, targetLab.longitude],
  );

  const radius = session?.radius ?? targetLab.radius ?? 50;

  // Koordinat simulasi (Dalam Lab: ~6m, Luar Lab: ~120m, Mock GPS)
  const userCoords = useMemo(() => {
    if (simMode === 'inside') {
      return {
        latitude: labCoord.latitude + 0.00005,
        longitude: labCoord.longitude + 0.00004,
        accuracy: 4,
        isMocked: false,
      };
    }
    if (simMode === 'outside') {
      return {
        latitude: labCoord.latitude + 0.0011,
        longitude: labCoord.longitude + 0.0009,
        accuracy: 8,
        isMocked: false,
      };
    }
    return {
      latitude: labCoord.latitude + 0.00003,
      longitude: labCoord.longitude + 0.00002,
      accuracy: 3,
      isMocked: true,
    };
  }, [simMode, labCoord]);

  // Kalkulasi jarak real-time via Haversine
  const distance = useMemo(() => {
    return calculateDistanceHaversine(userCoords, labCoord);
  }, [userCoords, labCoord]);

  const isWithinRadius = distance <= radius;

  // Evaluasi Guard (HF-04)
  const guard = useMemo(() => {
    return evaluateAttendanceGuard({
      session,
      participant: me,
      isOnline: true,
      isWithinRadius,
      isMocked: userCoords.isMocked,
      distanceMeters: distance,
      radiusMeters: radius,
    });
  }, [session, me, isWithinRadius, userCoords.isMocked, distance, radius]);

  // Timer countdown sesi praktikum
  useEffect(() => {
    if (!session || session.status !== 'berlangsung') {
      return;
    }

    const interval = setInterval(() => {
      setCountdownText(calculateRemainingTime(session.endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const handleExecuteCheckIn = async (verificationMethod: 'geofence' | 'qr_geofence' = 'geofence', qrCodeSecret?: string) => {
    if (!session || !me) return;

    setBusy(true);
    setFeedback(null);

    const checkInFn = dataService.checkInWithLocation ?? (async () => dataService.checkIn(session.id, me.id));

    const result = await checkInFn({
      sessionId: session.id,
      participantId: me.id,
      nim: me.nim,
      name: me.name,
      userCoordinates: userCoords,
      verificationMethod,
      qrCodeSecret,
      deviceInfo: `Expo Simulator (${simMode})`,
    });

    setBusy(false);

    if (result.ok) {
      setFeedback({
        tone: 'success',
        message: `Presensi berhasil! Kehadiran Anda tercatat di ${targetLab.name} (${Math.round(distance)}m).`,
      });
    } else {
      setFeedback({
        tone: 'error',
        message: result.reason || 'Gagal melakukan presensi.',
      });
    }
  };

  if (!session) {
    return (
      <ScreenScroll>
        <EmptyState
          title="Sesi tidak ditemukan"
          hint="Sesi praktikum mungkin sudah dihapus atau jadwal belum tersedia."
          actionLabel="Kembali"
          onAction={handleBack}
        />
      </ScreenScroll>
    );
  }

  const isAlreadyPresent = Boolean(me?.checkInAt);

  return (
    <>
      <ScreenScroll>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <ThemedText type="labelLg" themeColor="textSecondary">
            ← Kembali ke detail sesi
          </ThemedText>
        </Pressable>

        {feedback ? (
          <FeedbackBanner {...feedback} onDismiss={() => setFeedback(null)} />
        ) : null}

        {/* Informasi Utama Sesi Praktikum */}
        <Card style={styles.sessionCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleLeft}>
              <ThemedText type="labelSm" themeColor="onSurfaceSecondary">
                MATA KULIAH PRAKTIKUM
              </ThemedText>
              <ThemedText type="headlineMd" themeColor="onSurface">
                {session.courseName}
              </ThemedText>
              <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
                {session.classGroup} · Ruang: {session.room}
              </ThemedText>
            </View>
            <SessionStatusBadge status={session.status} />
          </View>

          <View style={[styles.timerBox, { backgroundColor: theme.surfaceAlt }]}>
            <View style={styles.timerRow}>
              <ThemedText type="labelSm" themeColor="onSurfaceSecondary">
                Sisa Waktu Presensi:
              </ThemedText>
              <ThemedText type="monoSm" style={[styles.timerValue, { color: theme.accent }]}>
                {countdownText}
              </ThemedText>
            </View>
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              Jadwal Sesi: {session.startTime} – {session.endTime} WIB
            </ThemedText>
          </View>
        </Card>

        {/* Komponen Radar Status Geofencing (HF-02) */}
        <GeofenceRadar
          labName={targetLab.name}
          roomName={`${targetLab.building} (${session.room})`}
          distanceMeters={distance}
          radiusMeters={radius}
          accuracyMeters={userCoords.accuracy}
          isWithinRadius={isWithinRadius}
          isMocked={userCoords.isMocked}
        />

        {/* Simulator Posisi GPS untuk kemudahan testing */}
        <Card style={styles.simCard}>
          <ThemedText type="labelSm" themeColor="onSurfaceSecondary">
            SIMULASI LOKASI PENGUJIAN (DEV/TESTING):
          </ThemedText>
          <View style={styles.chipRow}>
            <Pressable
              onPress={() => setSimMode('inside')}
              style={[
                styles.chip,
                {
                  backgroundColor: simMode === 'inside' ? theme.successBackground : theme.surfaceAlt,
                  borderColor: simMode === 'inside' ? theme.success : theme.border,
                },
              ]}>
              <ThemedText type="labelSm" style={{ color: simMode === 'inside' ? theme.success : theme.onSurface }}>
                📍 Dalam Lab (~6m)
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setSimMode('outside')}
              style={[
                styles.chip,
                {
                  backgroundColor: simMode === 'outside' ? theme.dangerBackground : theme.surfaceAlt,
                  borderColor: simMode === 'outside' ? theme.dangerBorder : theme.border,
                },
              ]}>
              <ThemedText type="labelSm" style={{ color: simMode === 'outside' ? theme.danger : theme.onSurface }}>
                🚶 Luar Lab (~120m)
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setSimMode('mock_gps')}
              style={[
                styles.chip,
                {
                  backgroundColor: simMode === 'mock_gps' ? theme.dangerBackground : theme.surfaceAlt,
                  borderColor: simMode === 'mock_gps' ? theme.dangerBorder : theme.border,
                },
              ]}>
              <ThemedText type="labelSm" style={{ color: simMode === 'mock_gps' ? theme.danger : theme.onSurface }}>
                ⚠️ Fake GPS
              </ThemedText>
            </Pressable>
          </View>
        </Card>

        {/* Tombol Eksekusi Presensi Mandiri */}
        <Card style={styles.actionCard}>
          {isAlreadyPresent ? (
            <View style={[styles.presentBox, { backgroundColor: theme.successBackground, borderColor: theme.success }]}>
              <ThemedText type="headlineMd" style={{ color: theme.success, textAlign: 'center' }}>
                ✓ Presensi Tercatat
              </ThemedText>
              <ThemedText type="bodySm" style={{ color: theme.success, textAlign: 'center' }}>
                Kehadiran Anda telah diverifikasi pada pukul {me?.checkInAt ?? '—'} WIB.
              </ThemedText>
            </View>
          ) : (
            <>
              <ActionButton
                label={busy ? 'Memverifikasi Presensi...' : 'HADIR SEKARANG (PRESENSI MANDIRI)'}
                tone="primary"
                disabled={!guard.canCheckIn || busy}
                onPress={() => handleExecuteCheckIn('geofence')}
              />

              <ThemedText
                type="bodySm"
                themeColor={guard.canCheckIn ? 'onSurface' : 'onSurfaceSecondary'}
                style={styles.guardHint}>
                {guard.message}
              </ThemedText>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <ThemedText type="labelSm" themeColor="onSurfaceSecondary">
                  -- atau --
                </ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>

              <ActionButton
                label="[Scan QR Code] Pindai Kode QR Asisten"
                tone="secondary"
                disabled={busy}
                onPress={() => setIsQrModalVisible(true)}
              />
            </>
          )}
        </Card>
      </ScreenScroll>

      {/* Modal QR Code Scanner (HF-07) */}
      <QrScannerModal
        visible={isQrModalVisible}
        onClose={() => setIsQrModalVisible(false)}
        session={session}
        isWithinRadius={isWithinRadius}
        distanceMeters={distance}
        onScanSuccess={(qrCodeSecret) => {
          setIsQrModalVisible(false);
          handleExecuteCheckIn('qr_geofence', qrCodeSecret);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    paddingVertical: Spacing.two,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.7,
  },
  sessionCard: {
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  titleLeft: {
    flex: 1,
    gap: Spacing.one,
  },
  timerBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerValue: {
    fontWeight: '700',
    fontSize: 16,
  },
  simCard: {
    gap: Spacing.one,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  actionCard: {
    gap: Spacing.two,
  },
  guardHint: {
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  presentBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: Spacing.one,
    alignItems: 'center',
  },
});

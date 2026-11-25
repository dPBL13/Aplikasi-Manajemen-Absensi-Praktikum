import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PracticumSession } from '@/types/domain';

interface QrScannerModalProps {
  visible: boolean;
  onClose: () => void;
  session: PracticumSession;
  isWithinRadius: boolean;
  distanceMeters: number;
  onScanSuccess: (qrCodeSecret: string) => void;
}

/**
 * HF-07 & FR-34: Modal Pemindai QR Code Praktikan.
 * Memindai QR Code asisten dengan validasi ganda radius geofencing.
 */
export function QrScannerModal({
  visible,
  onClose,
  session,
  isWithinRadius,
  distanceMeters,
  onScanSuccess,
}: QrScannerModalProps) {
  const theme = useTheme();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animasi scanning laser bar
  const [scanLineAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    scanLoop.start();
    return () => scanLoop.stop();
  }, [visible, scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  const handleSimulateScan = () => {
    if (!isWithinRadius) {
      setErrorMessage(
        `Presensi QR ditolak: Anda berada di luar radius laboratorium (${Math.round(distanceMeters)}m / Maks ${session.radius ?? 50}m).`,
      );
      return;
    }

    const secret = session.qrCodeSecret || `sec_${session.id}`;
    onScanSuccess(secret);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.header}>
            <ThemedText type="headlineMd" themeColor="onSurface">
              Pindai QR Presensi
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText type="headlineMd" themeColor="onSurfaceSecondary">
                ✕
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            Arahkan kamera ke kode QR yang ditampilkan di layar Asisten Praktikum.
          </ThemedText>

          {/* Area Kamera / Viewfinder */}
          <View style={[styles.viewfinderContainer, { backgroundColor: theme.surfaceAlt }]}>
            <View style={[styles.viewfinderBox, { borderColor: theme.accent }]}>
              {/* Corner markers */}
              <View style={[styles.cornerTL, { borderColor: theme.accent }]} />
              <View style={[styles.cornerTR, { borderColor: theme.accent }]} />
              <View style={[styles.cornerBL, { borderColor: theme.accent }]} />
              <View style={[styles.cornerBR, { borderColor: theme.accent }]} />

              {/* Animated laser line */}
              <Animated.View
                style={[
                  styles.scanLine,
                  { backgroundColor: theme.accent, transform: [{ translateY }] },
                ]}
              />
            </View>
          </View>

          {/* Status radius ganda */}
          <View
            style={[
              styles.radiusStatusBox,
              {
                backgroundColor: isWithinRadius ? theme.successBackground : theme.dangerBackground,
                borderColor: isWithinRadius ? theme.success : theme.dangerBorder,
              },
            ]}>
            <ThemedText
              type="labelSm"
              style={{ color: isWithinRadius ? theme.success : theme.danger, fontWeight: '700' }}>
              {isWithinRadius
                ? `✓ Lokasi Terverifikasi (${Math.round(distanceMeters)}m dari lab)`
                : `✕ Di Luar Radius Lab (${Math.round(distanceMeters)}m / Maks ${session.radius ?? 50}m)`}
            </ThemedText>
          </View>

          {errorMessage ? (
            <ThemedText type="bodySm" style={{ color: theme.danger, textAlign: 'center' }}>
              {errorMessage}
            </ThemedText>
          ) : null}

          {/* Tombol Simulasi Scan di Emulator / Dev */}
          <ActionButton
            label="Simulasikan Pindai QR Asisten"
            tone="primary"
            onPress={handleSimulateScan}
          />

          <ActionButton label="Batal" tone="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    padding: Spacing.one,
  },
  viewfinderContainer: {
    height: 220,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  viewfinderBox: {
    width: 180,
    height: 180,
    borderWidth: 1,
    borderRadius: Radius.md,
    position: 'relative',
    overflow: 'hidden',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  scanLine: {
    height: 3,
    width: '100%',
    opacity: 0.8,
  },
  radiusStatusBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
});

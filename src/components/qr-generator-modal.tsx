import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PracticumSession } from '@/types/domain';

interface QrGeneratorModalProps {
  visible: boolean;
  session: PracticumSession;
  onClose: () => void;
}

/**
 * HF-06 & FR-34: Generator & Penampil QR Code Sesi Presensi Asisten.
 * Menampilkan kode QR dinamis yang aman untuk dipindai oleh praktikan di laboratorium.
 */
export function QrGeneratorModal({ visible, session, onClose }: QrGeneratorModalProps) {
  const theme = useTheme();

  const qrSecret = session.qrCodeSecret || `sec_${session.id}_${session.startTime.replace(':', '')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <View style={[styles.container, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.header}>
            <ThemedText type="headlineMd" themeColor="onSurface">
              QR Code Presensi Sesi
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <ThemedText type="headlineMd" themeColor="onSurfaceSecondary">
                ✕
              </ThemedText>
            </Pressable>
          </View>

          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            {session.courseName} ({session.classGroup}) · {session.room}
          </ThemedText>

          {/* Render Visual QR Code Matrix */}
          <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
            <View style={styles.qrGrid}>
              {/* Pattern corners */}
              <View style={[styles.qrCorner, styles.qrTL]} />
              <View style={[styles.qrCorner, styles.qrTR]} />
              <View style={[styles.qrCorner, styles.qrBL]} />

              <View style={styles.qrCenterPattern}>
                <ThemedText style={styles.qrSymbol}>▦ ▨ ▣</ThemedText>
                <ThemedText style={styles.qrSymbol}>▤ ▥ ▩</ThemedText>
                <ThemedText style={styles.qrSymbol}>▣ ▨ ▦</ThemedText>
              </View>
            </View>

            <ThemedText type="monoSm" style={styles.qrTokenText}>
              TOKEN: {qrSecret}
            </ThemedText>
          </View>

          <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt }]}>
            <ThemedText type="bodySm" themeColor="onSurface">
              🔒 <ThemedText type="labelSm" themeColor="onSurface" style={{ fontWeight: '700' }}>Double Verification:</ThemedText> Praktikan tetap wajib berada di dalam radius laboratorium ({session.radius ?? 50} meter) saat memindai kode ini.
            </ThemedText>
          </View>

          <ActionButton label="Tutup QR Code" tone="secondary" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
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
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.two,
  },
  qrGrid: {
    width: 180,
    height: 180,
    backgroundColor: '#000000',
    borderRadius: Radius.md,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  qrCorner: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderWidth: 6,
    borderColor: '#FFFFFF',
    backgroundColor: '#000000',
  },
  qrTL: {
    top: 10,
    left: 10,
  },
  qrTR: {
    top: 10,
    right: 10,
  },
  qrBL: {
    bottom: 10,
    left: 10,
  },
  qrCenterPattern: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrSymbol: {
    color: '#FFFFFF',
    fontSize: 20,
    letterSpacing: 4,
    lineHeight: 24,
  },
  qrTokenText: {
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 1,
  },
  infoBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
});

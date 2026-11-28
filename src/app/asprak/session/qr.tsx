import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { findSession } from '@/services/selectors';

/**
 * HF-06 & FR-34: Layar Penuh Generator QR Code Presensi Asisten Praktikum.
 * Rute: /asprak/session/qr?id=[sessionId]
 */
export default function AsprakSessionQrScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useAppData();
  const theme = useTheme();

  const session = findSession(data, id);

  if (!session) {
    return (
      <ScreenScroll>
        <EmptyState
          title="Sesi tidak ditemukan"
          hint="Sesi praktikum mungkin belum dipilih atau sudah dihapus."
          actionLabel="Kembali"
          onAction={() => router.back()}
        />
      </ScreenScroll>
    );
  }

  const qrSecret = session.qrCodeSecret || `sec_${session.id}`;
  const qrPayload = React.useMemo(
    () =>
      JSON.stringify({
        sessionId: session.id,
        secret: qrSecret,
        courseName: session.courseName,
        classGroup: session.classGroup,
        room: session.room,
      }),
    [session.id, qrSecret, session.courseName, session.classGroup, session.room],
  );

  return (
    <ScreenScroll>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Kembali ke detail sesi"
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
        <ThemedText type="labelLg" themeColor="textSecondary">
          ← Kembali ke detail sesi
        </ThemedText>
      </Pressable>

      <Card style={styles.card}>
        <ThemedText type="headlineLg" themeColor="onSurface" style={styles.centerText}>
          QR Code Presensi
        </ThemedText>
        <ThemedText type="titleMd" themeColor="onSurface" style={styles.centerText}>
          {session.courseName} ({session.classGroup})
        </ThemedText>
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary" style={styles.centerText}>
          Ruang: {session.room} · Status: {session.status.toUpperCase()}
        </ThemedText>

        {/* Real QR Code Matrix */}
        <View style={styles.qrWrapper}>
          <View style={[styles.qrContainer, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
            <QRCode
              value={qrPayload}
              size={220}
              backgroundColor="#FFFFFF"
              color="#000000"
            />
            <ThemedText type="monoSm" style={styles.qrTokenText}>
              TOKEN: {qrSecret}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.surfaceAlt }]}>
          <ThemedText type="bodySm" themeColor="onSurface">
            Tampilkan QR Code ini kepada mahasiswa di laboratorium. Mahasiswa dapat memindai kode ini melalui tombol <ThemedText type="labelSm" themeColor="onSurface" style={{ fontWeight: '700' }}>[Pindai QR Code]</ThemedText> pada radar presensi mandiri mereka.
          </ThemedText>
        </View>

        <ActionButton label="Kembali ke Detail Sesi" tone="secondary" onPress={() => router.back()} />
      </Card>
    </ScreenScroll>
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
  card: {
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  centerText: {
    textAlign: 'center',
  },
  qrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrTokenText: {
    color: '#000000',
    fontWeight: '700',
    marginTop: Spacing.two,
  },
  infoBox: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    gap: Spacing.one,
  },
});

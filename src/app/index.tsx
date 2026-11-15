import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { asprakOverview } from '@/services/selectors';

/**
 * Pemilih peran (FR-25 sementara). Setelah autentikasi Firebase selesai,
 * layar ini diganti redirect berdasarkan role pengguna.
 */
export default function RolePickerScreen() {
  const data = useAppData();
  const theme = useTheme();
  const overview = asprakOverview(data);

  return (
    <ScreenScroll>
      <View style={styles.heading}>
        <ThemedText type="subtitle">Pilih perspektif</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Mode demo memakai data mock yang sama untuk kedua peran. Perubahan di satu sisi langsung
          terlihat di sisi lain.
        </ThemedText>
      </View>

      <RoleCard
        title="Asisten Praktikum"
        description="Kelola kelas, jadwal, kehadiran, rekap, dan pengajuan izin."
        meta={`${overview.classCount} kelas · ${overview.sessionCount} sesi · ${overview.pendingPermitCount} izin menunggu`}
        actionLabel="Masuk sebagai Asisten"
        onPress={() => router.replace('/asprak')}
      />

      <RoleCard
        title="Praktikan"
        description="Lihat jadwal, lakukan presensi, dan periksa riwayat kehadiran."
        meta="Presensi hanya aktif ketika sesi sedang berlangsung"
        actionLabel="Masuk sebagai Praktikan"
        onPress={() => router.replace('/praktikan')}
      />

      <ThemedView style={[styles.note, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">Catatan integrasi</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Data layer ada di src/services. Saat backend Firestore siap, cukup ganti satu baris di
          src/services/index.ts.
        </ThemedText>
      </ThemedView>
    </ScreenScroll>
  );
}

type RoleCardProps = {
  title: string;
  description: string;
  meta: string;
  actionLabel: string;
  onPress: () => void;
};

function RoleCard({ title, description, meta, actionLabel, onPress }: RoleCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={actionLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText type="default" style={styles.cardTitle}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {description}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {meta}
      </ThemedText>
      <ThemedText type="smallBold" style={{ color: theme.link }}>
        {actionLabel} →
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: Spacing.one,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardTitle: {
    fontWeight: 700,
  },
  note: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.75,
  },
});

import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { useAppData } from '@/services';
import { asprakOverview } from '@/services/selectors';

/**
 * Pemilih peran & status autentikasi (FR-01 s/d FR-04, FR-25).
 */
export default function RolePickerScreen() {
  const data = useAppData();
  const theme = useTheme();
  const { user, userProfile, role, logout } = useAuth();
  const overview = asprakOverview(data);

  return (
    <ScreenScroll>
      {/* Kartu Status Autentikasi Pengguna */}
      {user ? (
        <ThemedView
          type="backgroundElement"
          style={[styles.authCard, { borderColor: theme.accent }]}
        >
          <View style={styles.authInfo}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Akun Aktif: {role === 'asprak' ? 'Asisten Praktikum' : 'Praktikan'}
            </ThemedText>
            <ThemedText type="subtitle">
              {userProfile?.name || user.displayName || 'Pengguna'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {userProfile?.nim ? `NIM: ${userProfile.nim} · ` : ''}
              {user.email}
            </ThemedText>
          </View>

          <View style={styles.authActions}>
            <ActionButton
              label={
                role === 'asprak'
                  ? 'Buka Dashboard Asisten'
                  : 'Buka Dashboard Praktikan'
              }
              tone="primary"
              onPress={() =>
                router.replace(role === 'asprak' ? '/asprak' : '/praktikan')
              }
            />
            <ActionButton
              label="Keluar Akun"
              tone="secondary"
              onPress={async () => {
                await logout();
              }}
            />
          </View>
        </ThemedView>
      ) : (
        <ThemedView
          type="backgroundElement"
          style={[styles.authCard, { borderColor: theme.border }]}
        >
          <View style={styles.authInfo}>
            <ThemedText type="subtitle">Autentikasi Pengguna</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Masuk dengan akun praktikum Anda untuk sinkronisasi otomatis via Cloud Firestore.
            </ThemedText>
          </View>
          <View style={styles.authActions}>
            <ActionButton
              label="Masuk ke Akun"
              tone="primary"
              onPress={() => router.push('/(auth)/login')}
            />
            <ActionButton
              label="Daftar Akun Baru"
              tone="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </ThemedView>
      )}

      <View style={styles.heading}>
        <ThemedText type="subtitle">Mode Demo & Akses Langsung</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pilih perspektif di bawah untuk mengakses modul secara langsung:
        </ThemedText>
      </View>

      <RoleCard
        title="Asisten Praktikum (Asprak)"
        description="Kelola kelas, jadwal, kehadiran, rekap presensi, dan tinjau izin dengan AI."
        meta={`${overview.classCount} kelas · ${overview.sessionCount} sesi · ${overview.pendingPermitCount} izin menunggu`}
        actionLabel="Masuk sebagai Asisten"
        onPress={() => router.replace('/asprak')}
      />

      <RoleCard
        title="Praktikan"
        description="Lihat jadwal praktikum, lakukan presensi real-time, dan ajukan izin."
        meta="Presensi real-time & sinkronisasi instan via Cloud Firestore"
        actionLabel="Masuk sebagai Praktikan"
        onPress={() => router.replace('/praktikan')}
      />

      <ThemedView style={[styles.note, { borderColor: theme.border }]}>
        <ThemedText type="smallBold">Integrasi Backend Firebase & Gemini AI</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Modul Backend terhubung ke Cloud Firestore dan Google Gemini AI untuk klasifikasi alasan izin otomatis.
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
      ]}
    >
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
  authCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    gap: Spacing.three,
  },
  authInfo: {
    gap: Spacing.one,
  },
  authActions: {
    gap: Spacing.two,
  },
  heading: {
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  cardTitle: {
    fontWeight: '700',
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

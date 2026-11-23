import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import type { UserRole } from '@/types/auth';
import { validateRegistrationInput } from '@/utils/validation';

export default function RegisterScreen() {
  const { register } = useAuth();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('praktikan');
  const [asprakToken, setAsprakToken] = useState('');

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const handleRegister = async () => {
    const input = {
      name,
      email,
      nim,
      password,
      role,
      asprakToken: role === 'asprak' ? asprakToken : undefined,
    };

    const errors = validateRegistrationInput(input);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      setFeedback({ tone: 'error', message: firstError });
      return;
    }

    setBusy(true);
    setFeedback(null);

    const res = await register(input);
    setBusy(false);

    if (res.ok) {
      setFeedback({
        tone: 'success',
        message: 'Akun berhasil didaftarkan! Mengalihkan ke halaman utama...',
      });
      setTimeout(() => {
        router.replace('/');
      }, 1000);
    } else {
      setFeedback({ tone: 'error', message: res.reason });
    }
  };

  return (
    <ScreenScroll>
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <ThemedText type="displayMobile" themeColor="onSurface">
              Buat Akun Baru
            </ThemedText>
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              Lengkapi data diri Anda untuk membuat akun di sistem absensi praktikum.
            </ThemedText>
          </View>

          {feedback && (
            <FeedbackBanner
              tone={feedback.tone}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          )}

          <View style={styles.form}>
            <FormField
              label="Nama Lengkap"
              placeholder="Contoh: Laurensius Brian Prayoga"
              value={name}
              onChangeText={setName}
            />

            <FormField
              label="NIM (14 Digit)"
              placeholder="Contoh: 24060124130077"
              value={nim}
              onChangeText={setNim}
              keyboardType="number-pad"
              maxLength={14}
              hint="Format standar 14 digit angka mahasiswa."
            />

            <FormField
              label="Alamat Email"
              placeholder="nama@students.undip.ac.id"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <FormField
              label="Kata Sandi"
              placeholder="Minimal 6 karakter"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.roleContainer}>
              <ThemedText type="labelSm" themeColor="onSurface">
                Daftar Sebagai Peran
              </ThemedText>
              <View style={styles.roleToggle}>
                <RoleOption
                  label="Praktikan"
                  selected={role === 'praktikan'}
                  onPress={() => setRole('praktikan')}
                />
                <RoleOption
                  label="Asisten (Asprak)"
                  selected={role === 'asprak'}
                  onPress={() => setRole('asprak')}
                />
              </View>
            </View>

            {role === 'asprak' && (
              <FormField
                label="Token Verifikasi Asisten"
                placeholder="Masukkan token rahasia asisten"
                value={asprakToken}
                onChangeText={setAsprakToken}
                autoCapitalize="none"
                hint="Dibutuhkan untuk memverifikasi wewenang asisten praktikum."
              />
            )}

            <ActionButton
              label={busy ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}
              tone="primary"
              onPress={handleRegister}
              disabled={busy}
            />
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              Sudah memiliki akun?
            </ThemedText>
            <ActionButton
              label="Masuk ke Akun"
              tone="secondary"
              onPress={() => router.back()}
            />
          </View>
        </Card>
      </View>
    </ScreenScroll>
  );
}

function RoleOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.roleButton,
        selected
          ? { backgroundColor: theme.accent, borderColor: theme.accent }
          : {
              backgroundColor: theme.secondarySurface,
              borderColor: theme.secondaryBorder,
            },
      ]}>
      <ThemedText
        type="labelLg"
        style={{ color: selected ? theme.accentText : theme.secondaryText }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.five,
  },
  card: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.md,
  },
  roleContainer: {
    gap: Spacing.one,
  },
  roleToggle: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.two,
    alignItems: 'center',
  },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/card';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const theme = useTheme();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setFeedback({ tone: 'error', message: 'Email tidak boleh kosong.' });
      return;
    }
    if (!password) {
      setFeedback({ tone: 'error', message: 'Kata sandi tidak boleh kosong.' });
      return;
    }

    setBusy(true);
    setFeedback(null);

    const res = await login(identifier.trim(), password);
    setBusy(false);

    if (res.ok) {
      setFeedback({ tone: 'success', message: 'Login berhasil! Mengalihkan...' });
      setTimeout(() => {
        router.replace('/');
      }, 500);
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
              Selamat Datang
            </ThemedText>
            <ThemedText type="bodyMd" themeColor="onSurfaceSecondary">
              Masuk dengan akun praktikum Anda untuk mengelola atau mencatat presensi.
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
              label="Email"
              placeholder="nama@students.undip.ac.id"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              hint="Gunakan email yang Anda daftarkan. Login dengan NIM belum tersedia."
            />

            <FormField
              label="Kata Sandi"
              placeholder="Minimal 6 karakter"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <ActionButton
              label={busy ? 'Memeriksa...' : 'Masuk ke Aplikasi'}
              tone="primary"
              onPress={handleLogin}
              disabled={busy}
            />
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
              Belum memiliki akun?
            </ThemedText>
            <ActionButton
              label="Daftar Akun Baru"
              tone="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </Card>
      </View>
    </ScreenScroll>
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
  footer: {
    marginTop: Spacing.two,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.two,
    alignItems: 'center',
  },
});

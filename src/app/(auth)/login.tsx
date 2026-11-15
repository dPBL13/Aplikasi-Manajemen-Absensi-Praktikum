import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { FeedbackBanner, type FeedbackMessage } from '@/components/feedback-banner';
import { FormField } from '@/components/form-field';
import { ScreenScroll } from '@/components/screen-scroll';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const handleLogin = async () => {
    if (!identifier.trim()) {
      setFeedback({ tone: 'error', message: 'Email atau NIM tidak boleh kosong.' });
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
        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.header}>
            <ThemedText type="title">Selamat Datang</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
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
              label="Email atau NIM"
              placeholder="Contoh: 24060124130077 atau nama@students.undip.ac.id"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
              hint="Masukkan NIM 14 digit atau alamat email terdaftar."
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

          <View style={styles.footer}>
            <ThemedText type="small" themeColor="textSecondary">
              Belum memiliki akun?
            </ThemedText>
            <ActionButton
              label="Daftar Akun Baru"
              tone="secondary"
              onPress={() => router.push('/(auth)/register')}
            />
          </View>
        </ThemedView>
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
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  header: {
    gap: Spacing.one,
  },
  form: {
    gap: Spacing.three,
  },
  footer: {
    marginTop: Spacing.two,
    gap: Spacing.two,
    alignItems: 'center',
  },
});

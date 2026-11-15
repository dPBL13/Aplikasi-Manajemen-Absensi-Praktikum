import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface FeedbackData {
  tone: 'success' | 'error';
  message: string;
}

interface FeedbackBannerProps {
  feedback: FeedbackData;
  onDismiss: () => void;
}

export function FeedbackBanner({ feedback, onDismiss }: FeedbackBannerProps) {
  const theme = useTheme();
  const isSuccess = feedback.tone === 'success';
  const foreground = isSuccess ? theme.success : theme.danger;

  return (
    <ThemedView
      accessibilityLiveRegion="polite"
      style={[
        styles.banner,
        {
          backgroundColor: isSuccess ? theme.successBackground : theme.dangerBackground,
          borderColor: foreground,
        },
      ]}>
      <View style={styles.header}>
        <ThemedText type="smallBold" style={[styles.title, { color: foreground }]}>
          {isSuccess ? '✓ Berhasil' : '✕ Gagal'}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup notifikasi"
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" style={{ color: foreground }}>
            Tutup
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small" style={{ color: foreground }}>
        {feedback.message}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});

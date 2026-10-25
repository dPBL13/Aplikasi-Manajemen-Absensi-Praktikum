import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FeedbackTone = 'success' | 'error';

export type FeedbackMessage = {
  tone: FeedbackTone;
  message: string;
};

type FeedbackBannerProps = FeedbackMessage & {
  onDismiss: () => void;
};

export function FeedbackBanner({ tone, message, onDismiss }: FeedbackBannerProps) {
  const theme = useTheme();
  const isSuccess = tone === 'success';
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
          {isSuccess ? 'Berhasil' : 'Tidak dapat diproses'}
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tutup umpan balik"
          onPress={onDismiss}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}>
          <ThemedText type="smallBold" style={{ color: foreground }}>
            Tutup
          </ThemedText>
        </Pressable>
      </View>
      <ThemedText type="small">{message}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.one,
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

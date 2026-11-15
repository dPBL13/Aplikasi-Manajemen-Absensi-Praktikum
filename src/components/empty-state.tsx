import { StyleSheet } from 'react-native';

import { ActionButton } from './action-button';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
};

/** Kondisi kosong standar (FR-15) — jangan membuat empty state manual di layar. */
export function EmptyState({ title, hint, actionLabel, onAction }: EmptyStateProps) {
  return (
    <ThemedView type="surfaceAlt" style={styles.container}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <ActionButton label={actionLabel} tone="secondary" onPress={onAction} />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
});

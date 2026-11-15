import { StyleSheet, View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface EmptyStateProps {
  title: string;
  hint?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  hint,
  icon = '📋',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.box,
        {
          borderColor: theme.border,
        },
      ]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {hint}
        </ThemedText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={styles.actionWrap}>
          <ActionButton label={actionLabel} onPress={onAction} tone="secondary" />
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginVertical: Spacing.two,
  },
  icon: {
    fontSize: 36,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  hint: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  actionWrap: {
    marginTop: Spacing.three,
  },
});

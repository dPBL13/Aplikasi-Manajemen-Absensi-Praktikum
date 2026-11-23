import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  tone?: 'primary' | 'danger' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function ActionButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  style,
  accessibilityLabel,
}: ActionButtonProps) {
  const theme = useTheme();

  const palette =
    tone === 'secondary'
      ? {
          backgroundColor: theme.secondarySurface,
          borderColor: theme.secondaryBorder,
          color: theme.secondaryText,
        }
      : tone === 'danger'
        ? {
            backgroundColor: theme.dangerBackground,
            borderColor: theme.dangerBorder,
            color: theme.danger,
          }
        : {
            backgroundColor: theme.accent,
            borderColor: 'transparent',
            color: theme.accentText,
          };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled
          ? {
              backgroundColor: theme.disabled,
              borderColor: theme.border,
            }
          : palette,
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <ThemedText
        type="labelLg"
        style={[styles.label, { color: disabled ? theme.onDisabled : palette.color }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});

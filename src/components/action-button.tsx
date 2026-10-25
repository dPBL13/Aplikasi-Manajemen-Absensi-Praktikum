import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';

import { Palette, Spacing } from '@/constants/theme';
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
  const isSecondary = tone === 'secondary';
  const textColor = isSecondary
    ? theme.text
    : tone === 'danger'
      ? '#ffffff'
      : theme.accentText;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isSecondary
            ? theme.backgroundElement
            : tone === 'danger'
              ? Palette.danger
              : theme.accent,
          borderColor: isSecondary ? theme.border : 'transparent',
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}>
      <ThemedText type="smallBold" style={[styles.label, { color: textColor }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.45,
  },
});

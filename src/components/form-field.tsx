import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FormFieldProps = TextInputProps & {
  label: string;
  /** Pesan kesalahan validasi; mengubah border menjadi warna danger. */
  error?: string;
  hint?: string;
};

/**
 * Input teks berlabel dengan gaya konsisten (FR-23).
 * Semua form baru WAJIB memakai komponen ini agar tampilan seragam.
 */
export function FormField({ label, error, hint, style, multiline, ...inputProps }: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="labelSm" themeColor="onSurface">
        {label}
      </ThemedText>
      <TextInput
        placeholderTextColor={theme.onSurfaceSecondary}
        selectionColor={theme.accent}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: error ? theme.dangerBorder : theme.accent,
            color: theme.onSurface,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <ThemedText type="bodySm" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.two,
    ...Typography.bodyMd,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: Spacing.two,
  },
});

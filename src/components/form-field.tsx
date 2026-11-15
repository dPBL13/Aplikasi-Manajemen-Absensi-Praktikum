import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
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
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.link}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          {
            backgroundColor: theme.highlight,
            borderColor: error ? theme.danger : theme.border,
            color: theme.text,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary">
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
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 14,
  },
  inputMultiline: {
    minHeight: 88,
    paddingTop: Spacing.two + 2,
  },
});

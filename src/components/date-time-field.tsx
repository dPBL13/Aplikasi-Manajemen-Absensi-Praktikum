import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { BottomSheetModal } from './bottom-sheet-modal';
import { FormField } from './form-field';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseDateLabel, parseTimeLabel } from '@/utils/date-label';

type DateTimeFieldProps = {
  label: string;
  mode: 'date' | 'time';
  value: string;
  placeholder: string;
  /** Dipanggil setelah pengguna memilih tanggal/jam (native). */
  onChange: (date: Date) => void;
  /** Fallback input teks untuk platform web (picker native tidak tersedia). */
  onChangeText: (text: string) => void;
  error?: string;
  hint?: string;
};

function defaultValue(mode: 'date' | 'time'): Date {
  const date = new Date();

  if (mode === 'time') {
    date.setHours(8, 0, 0, 0);
  }

  return date;
}

function isSamePickerValue(mode: 'date' | 'time', left: Date, right: Date): boolean {
  if (mode === 'date') {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  return left.getHours() === right.getHours() && left.getMinutes() === right.getMinutes();
}

/**
 * Tombol tanggal/jam dengan picker native: kalender (tanggal) dan jam.
 * Web memakai input teks karena `@expo/ui` hanya tersedia di Android/iOS.
 */
export function DateTimeField({
  label,
  mode,
  value,
  placeholder,
  onChange,
  onChangeText,
  error,
  hint,
}: DateTimeFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date | null>(null);
  const [initial, setInitial] = useState<Date | null>(null);
  const parsed = mode === 'date' ? parseDateLabel(value) : parseTimeLabel(value);

  if (Platform.OS === 'web') {
    return (
      <FormField
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        maxLength={mode === 'time' ? 5 : undefined}
        error={error}
        hint={hint}
      />
    );
  }

  const pickerValue = draft ?? parsed ?? defaultValue(mode);

  const openPicker = () => {
    const next = parsed ?? defaultValue(mode);
    setInitial(next);
    setDraft(next);
    setOpen(true);
  };

  const closePicker = () => {
    setOpen(false);

    // Jangan menimpa nilai hanya karena sheet ditutup tanpa perubahan.
    if (draft && initial && !isSamePickerValue(mode, draft, initial)) {
      onChange(draft);
    }
  };

  const handleChange = (_event: unknown, date: Date) => {
    setDraft(date);

    if (Platform.OS === 'android') {
      onChange(date);
      setOpen(false);
    }
  };

  return (
    <View style={styles.field}>
      <ThemedText type="labelSm" themeColor="onSurface">{label}</ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityHint={`Membuka pemilih ${mode === 'date' ? 'tanggal' : 'jam'}`}
        onPress={openPicker}
        style={({ pressed }) => [
          styles.control,
          {
            backgroundColor: theme.surfaceAlt,
            borderColor: error ? theme.dangerBorder : theme.accent,
          },
          pressed && styles.pressed,
        ]}>
        <ThemedText
          type="bodyMd"
          themeColor={value ? 'onSurface' : 'onSurfaceSecondary'}
          style={styles.controlLabel}>
          {value || placeholder}
        </ThemedText>
        <ThemedText type="bodyMd" themeColor="onSurfaceSecondary">
          ▾
        </ThemedText>
      </Pressable>

      {error ? (
        <ThemedText type="bodySm" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="bodyMd" themeColor="onSurfaceSecondary">
          {hint}
        </ThemedText>
      ) : null}

      {Platform.OS === 'android' ? (
        open ? (
          <DateTimePicker
            value={pickerValue}
            mode={mode}
            presentation="dialog"
            display="default"
            is24Hour
            // Force the dark dialog: the app is dark-only and a light dialog
            // makes the cream accent text unreadable on some devices.
            themeVariant="dark"
            accentColor={theme.link}
            positiveButton={{ label: 'Pilih' }}
            negativeButton={{ label: 'Batal' }}
            onValueChange={handleChange}
            onDismiss={() => setOpen(false)}
          />
        ) : null
      ) : (
        <BottomSheetModal
          visible={open}
          title={mode === 'date' ? 'Pilih tanggal' : 'Pilih jam'}
          onClose={closePicker}>
          {open ? (
            <DateTimePicker
              value={pickerValue}
              mode={mode}
              display={mode === 'date' ? 'inline' : 'spinner'}
              locale="id-ID"
              // The picker sits on a cream sheet, so use the light variant
              // with the moss accent (cream-on-cream was unreadable).
              themeVariant="light"
              accentColor={theme.accent}
              onValueChange={handleChange}
              style={styles.picker}
            />
          ) : null}
        </BottomSheetModal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  control: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.two,
  },
  controlLabel: {
    flex: 1,
  },
  picker: {
    width: '100%',
  },
  pressed: {
    opacity: 0.72,
  },
});

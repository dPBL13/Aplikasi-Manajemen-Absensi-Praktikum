import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BottomSheetModal } from './bottom-sheet-modal';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  options: readonly SelectOption[];
  onSelect: (value: string) => void;
  error?: string;
  hint?: string;
};

/** Pilihan tunggal bergaya input; menekan tombol membuka dropdown bottom sheet. */
export function SelectField({
  label,
  value,
  placeholder,
  options,
  onSelect,
  error,
  hint,
}: SelectFieldProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.field}>
      <ThemedText type="labelSm" themeColor="onSurface">
        {label}
      </ThemedText>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityHint={`Membuka pilihan ${label.toLowerCase()}`}
        onPress={() => setOpen(true)}
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
          themeColor={selected ? 'onSurface' : 'onSurfaceSecondary'}
          style={styles.controlLabel}>
          {selected?.label ?? placeholder}
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
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
          {hint}
        </ThemedText>
      ) : null}

      <BottomSheetModal
        visible={open}
        title={`Pilih ${label.toLowerCase()}`}
        onClose={() => setOpen(false)}>
        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  setOpen(false);
                  onSelect(option.value);
                }}
                style={({ pressed }) => [
                  styles.option,
                  {
                    backgroundColor: isSelected ? theme.surfaceAlt : 'transparent',
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="bodyMd" themeColor="onSurface">
                  {option.label}
                </ThemedText>
                {isSelected ? (
                  <ThemedText type="labelSm" style={{ color: theme.accent }}>
                    Dipilih
                  </ThemedText>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </BottomSheetModal>
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
  options: {
    gap: Spacing.two,
  },
  option: {
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
  pressed: {
    opacity: 0.72,
  },
});

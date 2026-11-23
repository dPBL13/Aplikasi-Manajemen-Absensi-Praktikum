import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';

type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
  /** Versi ringkas sebaris untuk layar sempit. */
  compact?: boolean;
};

/** Kartu angka ringkasan untuk dashboard/rekap. */
export function StatTile({ label, value, hint, compact = false }: StatTileProps) {
  if (compact) {
    return (
      <ThemedView
        type="surfaceAlt"
        accessible
        accessibilityLabel={hint ? `${label} ${value}. ${hint}` : `${label} ${value}`}
        style={styles.tileCompact}>
        <ThemedText type="labelLg" themeColor="onSurfaceAlt" style={styles.valueCompact}>
          {value}
        </ThemedText>
        <ThemedText type="bodySm" themeColor="onSurfaceSecondary" style={styles.labelCompact}>
          {label}
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView type="surfaceAlt" style={styles.tile}>
      <ThemedText type="headlineLg" themeColor="onSurfaceAlt" style={styles.value}>
        {value}
      </ThemedText>
      <View style={styles.text}>
        <ThemedText type="labelSm" themeColor="onSurface">
          {label}
        </ThemedText>
        {hint ? (
          <ThemedText type="bodySm" themeColor="onSurfaceSecondary">
            {hint}
          </ThemedText>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minWidth: 140,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: Spacing.one,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
  },
  text: {
    gap: Spacing.half,
  },
  tileCompact: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.full,
  },
  valueCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  labelCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});

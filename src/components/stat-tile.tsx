import { StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type StatTileProps = {
  label: string;
  value: string;
  hint?: string;
};

/** Kartu angka ringkasan untuk dashboard/rekap. */
export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <ThemedView type="surfaceAlt" style={styles.tile}>
      <ThemedText type="subtitle" style={styles.value}>
        {value}
      </ThemedText>
      <View style={styles.text}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary">
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
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  value: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: 700,
  },
  text: {
    gap: 2,
  },
});

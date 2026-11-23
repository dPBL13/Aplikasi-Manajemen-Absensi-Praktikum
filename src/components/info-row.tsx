import { StyleSheet, View } from 'react-native';

import { ThemedText, type ThemedTextProps } from './themed-text';

import { Spacing } from '@/constants/theme';

type InfoRowProps = {
  label: string;
  value: string;
  valueType?: ThemedTextProps['type'];
};

export function InfoRow({ label, value, valueType = 'bodySm' }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="bodySm" themeColor="onSurfaceSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <ThemedText type={valueType} themeColor="onSurface" style={styles.value}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  label: {
    flexShrink: 0,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
});

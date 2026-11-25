import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DistancePillProps {
  distanceMeters?: number;
  radiusMeters?: number;
  isWithinRadius: boolean;
  labName?: string;
}

/**
 * HF-02: Badge / Pill status jarak pengguna terhadap radius geofencing laboratorium.
 * Menyediakan label teks eksplisit dan ikon aksesibel (bukan hanya kode warna).
 */
export function DistancePill({
  distanceMeters,
  radiusMeters = 50,
  isWithinRadius,
  labName,
}: DistancePillProps) {
  const theme = useTheme();

  const formattedDist =
    distanceMeters !== undefined ? `${Math.round(distanceMeters)}m` : 'Mendeteksi...';

  const backgroundColor = isWithinRadius ? theme.successBackground : theme.dangerBackground;
  const textColor = isWithinRadius ? theme.success : theme.danger;
  const borderColor = isWithinRadius ? theme.success : theme.dangerBorder;

  const statusIcon = isWithinRadius ? '✓' : '✕';
  const statusLabel = isWithinRadius
    ? `${statusIcon} Di Dalam Radius Lab (${formattedDist})`
    : `${statusIcon} Di Luar Radius Lab (${formattedDist} / Maks ${radiusMeters}m)`;

  return (
    <View style={[styles.pill, { backgroundColor, borderColor }]}>
      <ThemedText
        type="labelLg"
        style={[styles.text, { color: textColor }]}
        accessibilityLabel={`${statusLabel}${labName ? ` untuk ${labName}` : ''}`}>
        {statusLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two + Spacing.one,
    paddingVertical: Spacing.one + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  text: {
    fontWeight: '700',
  },
});

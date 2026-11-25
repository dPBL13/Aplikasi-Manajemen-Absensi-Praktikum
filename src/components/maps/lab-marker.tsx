import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Laboratory } from '@/types/domain';

type LabMarkerProps = {
  lab: Laboratory;
  selected?: boolean;
  onPress: (lab: Laboratory) => void;
};

/**
 * Marker laboratorium kustom (JH-04): pin bulat + label kode lab.
 * `tracksViewChanges` hanya aktif sebentar agar bitmap marker ter-render,
 * lalu dimatikan demi performa peta (terutama Android).
 */
export function LabMarker({ lab, selected = false, onPress }: LabMarkerProps) {
  const theme = useTheme();
  // Marker perlu di-track sebentar setiap kali tampilannya berubah, lalu "settle".
  const viewKey = `${selected}:${lab.code}`;
  const [settledKey, setSettledKey] = useState<string | null>(null);
  const tracks = settledKey !== viewKey;

  useEffect(() => {
    const id = setTimeout(() => setSettledKey(viewKey), 400);
    return () => clearTimeout(id);
  }, [viewKey]);

  return (
    <Marker
      coordinate={{ latitude: lab.latitude, longitude: lab.longitude }}
      onPress={() => onPress(lab)}
      tracksViewChanges={tracks}
      anchor={{ x: 0.5, y: 1 }}
      accessibilityLabel={`Laboratorium ${lab.name}`}
      zIndex={selected ? 2 : 1}>
      <View style={styles.wrapper}>
        <View
          style={[
            styles.label,
            {
              backgroundColor: selected ? theme.accent : theme.backgroundElement,
              borderColor: selected ? theme.accentPressed : theme.border,
            },
          ]}>
          <ThemedText
            type="labelSm"
            themeColor={selected ? 'accentText' : 'onSurface'}
            numberOfLines={1}>
            {lab.code}
          </ThemedText>
        </View>
        <View style={[styles.pin, { backgroundColor: theme.accent, borderColor: theme.backgroundElement }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  label: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: 1,
    maxWidth: 140,
  },
  pin: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    borderWidth: 3,
    marginTop: Spacing.one,
  },
});

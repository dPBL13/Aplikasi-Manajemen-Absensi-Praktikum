import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Marker } from '@maplibre/maplibre-react-native';

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
 * Menggunakan @maplibre/maplibre-react-native — tidak butuh Google Maps API key.
 * Perhatikan: MapLibre Marker menggunakan lngLat: [longitude, latitude].
 */
export function LabMarker({ lab, selected = false, onPress }: LabMarkerProps) {
  const theme = useTheme();

  return (
    <Marker
      id={`lab-${lab.id}`}
      lngLat={[lab.longitude, lab.latitude]}
      anchor="bottom">
      <TouchableOpacity
        onPress={() => onPress(lab)}
        accessibilityLabel={`Laboratorium ${lab.name}`}
        style={styles.wrapper}>
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
      </TouchableOpacity>
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

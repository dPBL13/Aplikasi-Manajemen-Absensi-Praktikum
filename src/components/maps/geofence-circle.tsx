import { Circle } from 'react-native-maps';

import { useTheme } from '@/hooks/use-theme';
import type { Laboratory } from '@/types/domain';

type GeofenceCircleProps = {
  lab: Pick<Laboratory, 'latitude' | 'longitude' | 'radius'>;
  /** true = pengguna di dalam radius (warna sukses), false/undefined = aksen netral. */
  isUserInside?: boolean;
};

/** "#RRGGBB" → "rgba(r, g, b, a)" tanpa mendefinisikan warna baru di komponen. */
function withAlpha(hex: string, alpha: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Overlay lingkaran transparan radius geofencing lab terpilih (JH-07, FR-29/FR-31). */
export function GeofenceCircle({ lab, isUserInside }: GeofenceCircleProps) {
  const theme = useTheme();
  const base = isUserInside ? theme.success : theme.accent;

  return (
    <Circle
      center={{ latitude: lab.latitude, longitude: lab.longitude }}
      radius={lab.radius}
      fillColor={withAlpha(base, 0.22)}
      strokeColor={withAlpha(base, 0.9)}
      strokeWidth={2}
      zIndex={0}
    />
  );
}

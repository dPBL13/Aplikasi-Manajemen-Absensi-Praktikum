import { GeoJSONSource, Layer } from '@maplibre/maplibre-react-native';
import { useMemo } from 'react';

import { useTheme } from '@/hooks/use-theme';
import type { GeofenceCoordinate, Laboratory } from '@/types/domain';

type GeofenceCircleProps = {
  lab: Pick<Laboratory, 'latitude' | 'longitude' | 'radius'>;
  /** true = pengguna di dalam radius (warna sukses), false/undefined = aksen netral. */
  isUserInside?: boolean;
};

type CircleFeature = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: { type: 'Polygon'; coordinates: [number, number][][] };
};

const EARTH_RADIUS_M = 6_371_008.8;

/** Poligon lingkaran (radius meter) di permukaan bumi, `steps` titik. */
export function circleToPolygon(
  center: GeofenceCoordinate,
  radiusMeters: number,
  steps = 64,
): CircleFeature {
  const lat = (center.latitude * Math.PI) / 180;
  const lng = (center.longitude * Math.PI) / 180;
  const angular = radiusMeters / EARTH_RADIUS_M;
  const ring: [number, number][] = [];

  for (let i = 0; i < steps; i += 1) {
    const bearing = (2 * Math.PI * i) / steps;
    const lat2 = Math.asin(
      Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing),
    );
    const lng2 =
      lng +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angular) * Math.cos(lat),
        Math.cos(angular) - Math.sin(lat) * Math.sin(lat2),
      );
    ring.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }
  ring.push(ring[0]);

  return {
    type: 'Feature',
    properties: {},
    geometry: { type: 'Polygon', coordinates: [ring] },
  };
}

/** Overlay lingkaran transparan radius geofencing lab terpilih (JH-07, FR-29/FR-31). */
export function GeofenceCircle({ lab, isUserInside }: GeofenceCircleProps) {
  const theme = useTheme();
  const color = isUserInside ? theme.success : theme.accent;
  const polygon = useMemo(
    () => circleToPolygon({ latitude: lab.latitude, longitude: lab.longitude }, lab.radius),
    [lab.latitude, lab.longitude, lab.radius],
  );

  return (
    <GeoJSONSource id="geofence-source" data={polygon}>
      <Layer
        id="geofence-fill"
        type="fill"
        source="geofence-source"
        paint={{ 'fill-color': color, 'fill-opacity': 0.22 }}
      />
      <Layer
        id="geofence-line"
        type="line"
        source="geofence-source"
        paint={{ 'line-color': color, 'line-width': 2 }}
      />
    </GeoJSONSource>
  );
}
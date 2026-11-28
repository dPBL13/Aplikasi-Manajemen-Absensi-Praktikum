declare module 'react-native-maps' {
  import React, { Component } from 'react';
  import { ViewProps } from 'react-native';

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapViewProps extends ViewProps {
    provider?: string;
    initialRegion?: Region;
    region?: Region;
    showsCompass?: boolean;
    toolbarEnabled?: boolean;
    showsUserLocation?: boolean;
    onPress?: (event: any) => void;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export class MapView extends Component<MapViewProps> {
    animateToRegion(region: Region, duration?: number): void;
    fitToCoordinates(coordinates: LatLng[], options?: any): void;
  }

  export default MapView;

  export const PROVIDER_GOOGLE: string;

  export interface MarkerProps extends ViewProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    onPress?: (event: any) => void;
    tracksViewChanges?: boolean;
    anchor?: { x: number; y: number };
    zIndex?: number;
    flat?: boolean;
    tappable?: boolean;
    children?: React.ReactNode;
    [key: string]: any;
  }

  export class Marker extends Component<MarkerProps> {}

  export interface CircleProps extends ViewProps {
    center: LatLng;
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    zIndex?: number;
    [key: string]: any;
  }

  export class Circle extends Component<CircleProps> {}
}

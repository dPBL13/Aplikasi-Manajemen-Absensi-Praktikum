import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type TabIconName =
  | 'calendar'
  | 'class'
  | 'recap'
  | 'permit'
  | 'lab'
  | 'history'
  | 'map';

interface TabBarIconProps {
  name: TabIconName;
  color?: any;
  size?: number;
  focused?: boolean;
}

export function TabBarIcon({ name, color, size = 22, focused = false }: TabBarIconProps) {
  const strokeWidth = focused ? 2.3 : 1.8;
  const strokeColor = typeof color === 'string' ? color : '#FFFFFF';

  switch (name) {
    case 'calendar':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="4"
            width="18"
            height="18"
            rx="3"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line x1="16" y1="2" x2="16" y2="6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="2" x2="8" y2="6" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="3" y1="10" x2="21" y2="10" stroke={strokeColor} strokeWidth={strokeWidth} />
          {focused ? (
            <>
              <Circle cx="8" cy="14" r="1.2" fill={strokeColor} />
              <Circle cx="12" cy="14" r="1.2" fill={strokeColor} />
              <Circle cx="16" cy="14" r="1.2" fill={strokeColor} />
              <Circle cx="8" cy="18" r="1.2" fill={strokeColor} />
              <Circle cx="12" cy="18" r="1.2" fill={strokeColor} />
            </>
          ) : null}
        </Svg>
      );

    case 'class':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Line x1="8" y1="7" x2="16" y2="7" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="8" y1="11" x2="14" y2="11" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'recap':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Line x1="18" y1="20" x2="18" y2="10" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="12" y1="20" x2="12" y2="4" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="6" y1="20" x2="6" y2="14" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="3" y1="20" x2="21" y2="20" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );

    case 'permit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 12l2 2 4-4"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Path d="M14 2v6h6" stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'lab':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10 2v7.31a2 2 0 0 1-.37 1.17l-4.26 6.09A2 2 0 0 0 7.02 20h9.96a2 2 0 0 0 1.65-3.43l-4.26-6.09a2 2 0 0 1-.37-1.17V2"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Line x1="8.5" y1="2" x2="15.5" y2="2" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Line x1="7" y1="15" x2="17" y2="15" stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );

    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth={strokeWidth} />
          <Path
            d="M12 7v5l3 3"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );

    case 'map':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
          <Circle cx="12" cy="9" r="2.5" stroke={strokeColor} strokeWidth={strokeWidth} />
        </Svg>
      );

    default:
      return null;
  }
}

// Icônes SVG dessinées à la main — stroke 1.5px uniforme
// Aucune bibliothèque Material/Ionicons — direction éditoriale LoveMap
import React from 'react';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { T } from '@/constants/theme';

type IcoProps = { size?: number; color?: string };

export function IcoPin({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="8.5" r="2.5" stroke={color} strokeWidth="1.5" />
    </Svg>
  );
}

export function IcoList({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h12M4 12h16M4 17h9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoCircle({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="10" r="3.2" stroke={color} strokeWidth="1.5" />
      <Circle cx="16" cy="11" r="2.6" stroke={color} strokeWidth="1.5" />
      <Path d="M3.5 19c.6-2.6 2.8-4.2 5.5-4.2s4.9 1.6 5.5 4.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M14.2 18c.5-1.7 1.7-2.7 3.3-2.7 1.5 0 2.7 1 3.2 2.7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoUser({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="9" r="3.4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M5 20c1-4 4-5.5 7-5.5s6 1.5 7 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoPlus({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoArrow({ size = 18, color = T.textFaint, dir = 'left' }: IcoProps & { dir?: 'left' | 'right' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={dir === 'right' ? { transform: [{ scaleX: -1 }] } : undefined}>
      <Path d="M14 6l-6 6 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcoClose({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoHeat({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3c1 3 4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 2-4 0 1.5 1 2 2 2 0-2-1-3 0-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoSearch({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path d="M20 20l-4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoCheck({ size = 16, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcoTrash({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function IcoEdit({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 20h4l11-11-4-4L4 16v4z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M14 6l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoCog({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

export function IcoBell({ size = 18, color = T.textFaint }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2H4.5L6 16z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
  );
}

// Wordmark SVG — cœur cousu en pointillés entre "love" et "map"
export function IcoHeartDashed({ size = 18, color = T.primary }: IcoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"
        stroke={color}
        strokeWidth="1.4"
        strokeDasharray="2 2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

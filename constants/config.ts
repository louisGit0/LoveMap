export const APP_CONFIG = {
  MIN_AGE: 18,
  APP_NAME: 'LoveMap',
  MAPBOX_STYLE: (process.env.EXPO_PUBLIC_MAPBOX_STYLE as string | undefined) ?? 'mapbox://styles/mapbox/dark-v11',
} as const;

/** Couleurs fixes — ne varient pas avec le thème */
export const COLORS = {
  primary: '#ff2d87',
  primaryDim: '#ff2d8780',
  primaryGlow: '#ff2d8733',
  danger: '#c41960',
  mapBg: '#0d1a2e',
  black: '#000000',
  white: '#ffffff',
} as const;

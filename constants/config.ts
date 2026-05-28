export const APP_CONFIG = {
  MIN_AGE: 18,
  APP_NAME: 'LoveMap',
  MAPBOX_STYLE: (process.env.EXPO_PUBLIC_MAPBOX_STYLE as string | undefined) ?? 'mapbox://styles/mapbox/dark-v11',
} as const;

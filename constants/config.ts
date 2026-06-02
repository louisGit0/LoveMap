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

/** Constantes data-viz carte (D-08/D-09) — hors tokens de thème (invariantes dark/light) */
export const MAP_COLORS = {
  emberAmber: '#ffb020', // heatmap — densité forte (cœur des zones intenses)
  emberGold: '#ffc24d', // heatmap — densité maximale
  mapBaseDark: '#08080a', // base anthracite du style Mapbox Studio (référence, non rendue côté RN)
} as const;

/**
 * URL d'aperçu de carte STATIQUE (Mapbox Static Images API) — rendu via <Image>.
 * Utilisé dans les sheets natifs (création/détail) car une MapView GL native rend NOIR
 * dans un form sheet iOS (la surface Metal ne s'attache pas au contexte de présentation).
 * Reprend le style custom de APP_CONFIG.MAPBOX_STYLE + un pin rose à la position.
 */
export function mapboxStaticUrl(
  longitude: number,
  latitude: number,
  width = 600,
  height = 300,
  zoom = 15,
): string {
  const style = APP_CONFIG.MAPBOX_STYLE.replace('mapbox://styles/', '');
  const token = (process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string | undefined) ?? '';
  // PAS d'overlay pin-s+...() : les parenthèses cassent le chargement de l'URL par <Image> iOS
  // (NSURL la rejette) → image noire. Le pin rose est dessiné par-dessus l'image en RN.
  return `https://api.mapbox.com/styles/v1/${style}/static/${longitude},${latitude},${zoom}/${width}x${height}@2x?access_token=${token}`;
}

export type Theme = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  cardRadius: number;
  pill: number;
};

export const darkTheme: Theme = {
  bg: '#000000',
  surface: '#0a0a0a',
  surface2: '#141414',
  border: '#1f1f1f',
  text: '#ffffff',
  textDim: '#d9d9d9',
  textFaint: '#8a8a8a',
  primary: '#ff2d87',
  secondary: '#ff6aa8',
  success: '#ff2d87',
  danger: '#a91860',
  cardRadius: 4,
  pill: 4,
};

export const lightTheme: Theme = {
  bg: '#ffffff',
  surface: '#f7f7f7',
  surface2: '#efefef',
  border: '#e2e2e2',
  text: '#0a0a0a',
  textDim: '#2a2a2a',
  textFaint: '#7a7a7a',
  primary: '#ff2d87',
  secondary: '#ff6aa8',
  success: '#ff2d87',
  danger: '#c41960',
  cardRadius: 4,
  pill: 4,
};

// Rétrocompatibilité pour les valeurs par défaut des icônes
export const T = darkTheme;

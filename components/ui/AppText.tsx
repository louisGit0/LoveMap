import React from 'react';
import { Text, TextProps } from 'react-native';
import { F } from '@/constants/fonts';

// Primitive texte qui borne le Dynamic Type par variant (FOND-04 / D-04).
// AppText reste MINCE : variant -> fontFamily (F.xxx) + maxFontSizeMultiplier.
// Aucune source de vérité typographique nouvelle (D-06) ; la couleur passe par `style`.
// NON appliqué en masse en Phase 1 (D-05) : créé seulement, migration progressive phases 2-5.
type Variant = 'body' | 'title' | 'eyebrow' | 'display';

// Mapping variant -> famille typographique (constants/fonts.ts, source unique — D-06)
const VARIANT_FONT: Record<Variant, string> = {
  body: F.sans, // corps UI (Inter Tight)
  title: F.serif, // titres éditoriaux (Cormorant Garamond italic)
  eyebrow: F.mono, // eyebrows / métadonnées (JetBrains Mono)
  display: F.serifLight, // hero « page de couverture » Cover 56 (Cormorant Garamond 300 italic) — D-06
};

// Bornes maxFontSizeMultiplier par variant (D-04)
const MAX_SCALE: Record<Variant, number> = {
  body: 2.0, // accessibilité large
  title: 1.3, // protège la typo serif éditoriale d'une casse de layout
  eyebrow: 1.2, // mono / eyebrows
  display: 1.15, // hero unique de couverture — très serré, ne doit jamais déborder (D-06)
};

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return (
    <Text
      allowFontScaling
      maxFontSizeMultiplier={MAX_SCALE[variant]}
      style={[{ fontFamily: VARIANT_FONT[variant] }, style]}
      {...props}
    />
  );
}

# Synthèse de recherche — Refonte UI/UX iOS LoveMap

**Date :** 2026-05-29
**Sources :** STACK.md (carte/Mapbox), ARCHITECTURE.md (patterns iOS), FEATURES.md (design), PITFALLS.md (pièges)

---

## TL;DR

La refonte est faisable avec un **minimum de nouvelles dépendances** : le style Mapbox custom ne demande aucun code (variable d'env existante), et les bottom sheets natifs + le swipe-back sont déjà fournis par `react-native-screens` via Expo Router. La complexité réelle se concentre sur deux migrations : **PointAnnotation → ShapeSource (clustering)** et l'**introduction de reanimated/gesture-handler** (non installés). Le principal risque n'est pas le code mais le **`runtimeVersion` statique** dans `app.json`, qui transforme tout ajout natif + OTA en crash TestFlight.

---

## Stack & Carte (confiance : Haute)

- **Style Mapbox custom = zéro code.** Créer le style dans Mapbox Studio (base Dark, labels masqués dans l'éditeur), publier, injecter via `EXPO_PUBLIC_MAPBOX_STYLE` (déjà câblé). Le token `pk.*` actuel (`styles:read`) suffit. Ne PAS compter sur les toggles runtime de labels (réservés au style Standard, pas garanti sur dark-v11).
- **Clustering = migration obligatoire hors `PointAnnotation`.** Nécessite une source GeoJSON (`ShapeSource cluster={true}` + `CircleLayer` + `SymbolLayer` pour `point_count`). Bénéfice double : clustering **et** correction de la chute de framerate iOS connue avec les `PointAnnotation` à enfant custom (#1309). Tradeoff : le look « pin » individuel disparaît au profit de cercles rose/noir. Tap cluster → `getClusterExpansionZoom()` + `camera.setCamera()`. Piège : propriété `clusterMaxZoomLevel` (et non `clusterMaxZoom`).
- **Heatmap : structure déjà bonne.** `heatmapColor` doit interpoler sur `['heatmap-density']` avec stop 0 transparent (déjà fait). Raffiner : rampe rose→ambre alignée sur `#ff2d87`, décroître `heatmapOpacity` aux zooms élevés pour transition fluide heatmap→clusters.

## Patterns iOS (confiance : Haute, sauf iOS 26 sheets)

- **Bottom sheets natifs SANS nouvelle dépendance.** Expo Router `presentation: 'formSheet'` + `sheetAllowedDetents` / `sheetGrabberVisible` / `sheetCornerRadius` (fourni par `react-native-screens 4.16`) donne un vrai sheet iOS. Utiliser des detents numériques `[0.5, 1]`, éviter `'fitToContents'` (bugs iOS 26). `@gorhom/bottom-sheet` réservé aux sheets persistants non-modaux (compat SDK 54 instable).
- **Swipe-back natif gratuit.** `gestureEnabled: true` par défaut sur le native stack. Migrer les `Modal`/`TouchableOpacity` custom vers des routes Stack récupère ce comportement. Mitiger le flash-au-swipe avec `contentStyle: { backgroundColor: T.bg }`.
- **Haptics centralisés.** Créer `lib/haptics.ts` (fire-and-forget) avec mapping prescriptif : selection / impact light-medium-heavy / notification success-warning-error.
- **Dynamic Type maîtrisé.** Garder `allowFontScaling: true`, borner via `maxFontSizeMultiplier` par variant (corps ~2.0, gros titres serif ~1.3) dans un composant `AppText`.

## Design éditorial × iOS (confiance : Haute)

- **Stratégie gagnante :** figer la coquille native iOS (tab bar, sheets, gestes — ce que l'utilisateur connaît) et concentrer tout le caractère de marque dans la **typographie, les eyebrows mono, les numéros de page, le whitespace**.
- **3 archétypes réutilisables couvrent les 9 écrans** (construire 3 patterns, pas 9 écrans isolés) :
  - *Page de couverture* → auth, profil, step âge
  - *Table des matières* → liste points, cercle, demandes (gros numéros + métadonnées mono alignées droite)
  - *Page de carnet* → détail point, sheet carte, form création (N°00X + note serif géante + pull-quote italic)
- **4 leviers visuels :** contraste d'échelle serif/sans · whitespace asymétrique · tension angles francs (marque) × arrondis (système) · layering par valeur avec le rose comme encre d'accent unique.
- **Meilleur ROI faible coût :** empty states éditoriaux (texte de carnet FR, pas d'illustration stock) + bottom sheet de détail carte traité comme mini-page éditoriale. Data-viz strictement monochrome + un seul rose.
- **Anti-features (à NE PAS faire) :** FAB rond Material, lottie/mascotte, shimmer coloré, avatars ronds, bento glassmorphism.

## Pièges critiques (confiance : Haute)

| Piège | Signal d'alerte | Prévention |
|-------|-----------------|------------|
| **`runtimeVersion: "1.0.0"` statique** dans app.json | OTA poussé après ajout natif → crash au lancement | Tout ajout natif (reanimated, gesture-handler, gorhom, assets Mapbox) = bump runtimeVersion + nouveau build EAS AVANT. OTA réservé au JS/style pur |
| **Reanimated v4 / gesture-handler frais** (non installés) | Gestes silencieusement morts | Reanimated v4.x (worklets, New Arch only) ; NE PAS éditer babel.config.js (géré par babel-preset-expo) ; wrapper racine unique `GestureHandlerRootView` |
| **iOS 26 formSheet trop petit** (screens 4.16, #3235) | Sheet riquiqui sur iOS 26 | Detents ≥ 0.7 ou fallback gorhom |
| **Clustering iOS quirks** (#1746/#2913 onPress, #2001 expansionZoom) | Tap cluster sans effet, crash expansionZoom | Tester sur device iOS physique (pas simulateur), try/catch sur `getClusterExpansionZoom` |
| **Régressions thème/safe-area/Dynamic Type** | Layout cassé en clair OU avec gros texte | Tester les deux thèmes + Dynamic Type à chaque écran refondu |

---

## Implications pour la roadmap

1. **Phase fondations d'abord** : installer reanimated v4 + gesture-handler proprement, créer `lib/haptics.ts` + composant `AppText`, passer `runtimeVersion` en politique `fingerprint`, poser `GestureHandlerRootView`. C'est le socle de tout le reste et le plus risqué côté TestFlight.
2. **Carte ensuite** : style custom (rapide) + migration clustering (risquée, à tester sur device) + heatmap.
3. **Refonte écrans par archétype** : construire les 3 patterns réutilisables, puis appliquer aux 9 écrans, en migrant les modales custom vers des formSheets natifs au passage.
4. **Stabilisation transverse** : vérification #15/#16 sur TestFlight peut se faire en parallèle / tôt.

---
*Synthèse créée : 2026-05-29*

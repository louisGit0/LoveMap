---
phase: 02-carte-stylis-e
plan: 02
status: complete
requirements: [MAP-02]
---

# Summary 02-02 — Heatmap rose→ambre + falloff zoom (MAP-02)

## Objective atteint

Refonte de la heatmap en dégradé « braise » rose→ambre avec opacité décroissante au zoom (lueur douce). Tranche visible en mode heatmap.

## Modifications

- **`constants/config.ts`** : nouveau const exporté `MAP_COLORS` avec `emberAmber:'#ffb020'`, `emberGold:'#ffc24d'`, `mapBaseDark:'#08080a'` (data-viz, hors tokens de thème). `mapBg:'#0d1a2e'` laissé tel quel mais plus utilisé (rejeté par D-03).
- **`components/map/HeatmapLayer.tsx`** : `heatmapColor` = interpolate sur `['heatmap-density']`, premier stop `rgba(0,0,0,0)` transparent (OBLIGATOIRE — RESEARCH Unknown #2), montée rose→corail→ambre→or (`MAP_COLORS.emberAmber`/`emberGold` aux deux derniers stops). `heatmapOpacity` passé de scalaire 0.85 à interpolate sur `['zoom']` 0.85→0.25 (D-09). `heatmapRadius` 22/44/70, `heatmapIntensity` 0.8/1.4. `heatmapWeight` inchangé. Cast `as any` + `useMemo` GeoJSON conservés.

## Vérification

- `rgba(0,0,0,0)` présent (premier stop) ; `emberGold` présent ; ancien dégradé `e91e8c`/`ff5722`/`156,39,176` supprimé ; `heatmapOpacity` interpolé sur zoom.
- `npx tsc --noEmit` : 0 nouvelle erreur (38 baseline).

## Vérification device (gate de phase — différée)

Rendu GPU à valider sur device physique/TestFlight (diffère du simulateur) : mode heatmap → dégradé braise, opacité décroît en lueur douce au zoom proche, aucune teinte rose globale.

## Self-Check: PASSED

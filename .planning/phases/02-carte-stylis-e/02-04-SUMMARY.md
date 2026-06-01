---
phase: 02-carte-stylis-e
plan: 04
status: complete
requirements: [UI-02]
subsystem: map-controls
tags: [ui, map, controls, haptics, d-12, d-10]
provides:
  - "Bandeau de contrôles éditorial flottant (MapHeader) — surface lisible 0.92, toggle segmenté Points/Heatmap"
  - "Trigger pill FriendSelector arrondi continu + haptics.select"
  - "Bouton Recentrer détaché squircle 40×40 + haptics.tap + a11y"
  - "IcoTarget (crosshair recentrer) dans components/icons.tsx"
requires:
  - "T.radiusLg/Sm/Xs + fab (02-01)"
  - "lib/haptics.ts, AppText (Phase 1)"
key-files:
  created: []
  modified:
    - components/map/MapHeader.tsx
    - components/map/FriendSelector.tsx
    - components/map/AppMapView.tsx
    - components/icons.tsx
metrics:
  tasks: 3
  files: 4
  completed: 2026-06-01
---

# Phase 2 Plan 04 : Bandeau de contrôles éditorial Summary

Refonte des contrôles flottants de la carte (bandeau toggle, sélecteur d'ami, recentrer) en cluster éditorial signature, lisible et arrondi iOS (D-10/D-12), avec retour haptique mappé — sans flou natif (règle 13).

## Objective atteint

L'écran carte passe d'une barre pleine largeur à angles francs à un **bandeau flottant éditorial** (carte semi-opaque lisible, coins continus), un **toggle segmenté Points/Heatmap** (accent rose réservé au segment actif), une **pill de sélection d'ami** arrondie continue, et un **bouton Recentrer détaché** en squircle 40×40 au-dessus du FAB. Tous les contrôles déclenchent le bon haptique (`select` / `tap`). Couverture UI-02 complétée avec 02-01 (tokens) et 02-03 (FAB + markers).

## Modifications

### Task 1 — `components/map/MapHeader.tsx` (commit `33cc07d`)
- Barre pleine largeur → **carte flottante** : `top: insets.top + 8`, marges latérales 16, `borderRadius: T.radiusLg` (22) + `borderCurve:'continuous'`, bord `1px T.border`.
- Surface translucide LISIBLE `rgba(10,10,10,0.92)` (constante d'overlay carte assumée — le bandeau flotte au-dessus de la carte Mapbox toujours sombre, correct en dark ET light), **aucun flou natif** (règle 13).
- Bloc titre via `AppText` variant `eyebrow` (`lovemap`) / `title` (`mes moments · NN` ou `carte de {nom}`) → Dynamic Type borné.
- **Toggle segmenté** : conteneur `radiusSm` bordé, segments `radiusXs` + `borderCurve`, segment actif `T.primary` + `T.text`, inactif `T.textFaint`. Labels renommés « Map »→ **« Points »** / « Heatmap ». `haptics.select()` à chaque changement de mode.

### Task 2 — `components/map/FriendSelector.tsx` (commit `3c8e549`)
- Trigger pill restylé : `borderRadius: T.radiusXs` + `borderCurve:'continuous'`, `pillPadX = 12`, surface `T.surface@0.92`, bord `1px T.border`. Icône `IcoUser` conservée.
- Label visible « Maps » → **« Vue »** (français, règle 6).
- `haptics.select()` ajouté dans `handleSelect`. **Corps de la modal/sheet inchangé** (liste d'amis intacte).

### Task 3 — `components/map/AppMapView.tsx` + `components/icons.tsx` (commit `bf79ec3`)
- Bouton Recentrer **détaché** bas-droite au-dessus du FAB (`right: 28`, `bottom: insets.bottom + 144`, centré sur le FAB 56), **squircle 40×40** (`borderRadius: T.radiusSm` + `borderCurve`), surface `T.surface@0.92` + bord `1px T.border`.
- Label texte remplacé par une icône SVG **`IcoTarget`** (crosshair rose) — nouvelle `Ico*` ajoutée à `components/icons.tsx` (pattern S4, sanctionné par l'action du plan).
- `haptics.tap()` dans `handleRecenter` ; `accessibilityLabel="Recentrer sur ma position"` (+ `accessibilityRole="button"`).
- Garde `showRecenter` et `styleURL={APP_CONFIG.MAPBOX_STYLE}` **inchangés** (MAP-01 reste au plan 02-05).

## Deviations from Plan

### Auto-fixed / sanctionné

**1. [Rule 2 — fonctionnalité] Ajout de `IcoTarget` dans `components/icons.tsx`**
- **Trouvé pendant :** Task 3
- **Raison :** Le bouton Recentrer cible une forme squircle 40×40 ; le label mono « Recentrer » ne tient pas dans 40px. Le plan (action Task 3) et le pattern S4 autorisent explicitement d'introduire une icône SVG via une nouvelle `Ico*` dans `components/icons.tsx`.
- **Fix :** nouvelle icône crosshair `IcoTarget` (Circle + center dot + 4 ticks, stroke 1.5px, cohérente avec les icônes existantes). Le label a11y porte le noun explicite « Recentrer sur ma position ».
- **Fichiers modifiés :** components/icons.tsx
- **Commit :** bf79ec3

Pas d'autre déviation — les 3 tasks suivent le plan.

## Vérification

Assertions source (rg) — toutes vertes :
- MapHeader : `borderCurve` (3), `rgba(10,10,10,0.92)` (1), **`BlurView` absent**, `Points`/`Heatmap` (présents), ancien label « Map » seul absent, `haptics.select` (1), `T.radiusLg` (1).
- FriendSelector : `borderCurve` (1), `T.radiusXs` (1), `haptics.select` (1), `IcoUser` (2), `FlatList` (corps intact).
- AppMapView : `borderCurve` (1), `T.radiusSm` (1), `haptics.tap` (1), `accessibilityLabel="Recentrer sur ma position"` (1), `showRecenter` (2), `APP_CONFIG.MAPBOX_STYLE` (1).

`npx tsc --noEmit` : **38 erreurs baseline inchangées (0 nouvelle erreur)** après les 3 tasks. (L'erreur `renderMode="native"` sur `MapboxGL.UserLocation` est préexistante au baseline — non touchée, comptée dans les 38.)

Pas de framework de test (acceptance = assertions rg + tsc). Validation device (gate de phase) en attente : bandeau lisible, toggle Points/Heatmap + haptique, pill ami + haptique, Recentrer arrondi + haptique light ; dark ET light.

## Known Stubs

Aucun. Tous les contrôles sont câblés aux callbacks/stores existants (viewMode, FriendSelector, recenter).

## Self-Check: PASSED

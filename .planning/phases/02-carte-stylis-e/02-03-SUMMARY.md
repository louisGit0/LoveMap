---
phase: 02-carte-stylis-e
plan: 03
status: complete
requirements: [MAP-03, UI-02]
subsystem: map
tags: [markers, fab, reanimated, haptics, snapshot, squircle]
provides:
  - "PointMarker: pin raffiné + variante PinIconSelected + sélection via refresh() (re-snapshot)"
  - "map/index: montage staggered des markers (cascade D-07) + FAB squircle reanimated + haptics.press()/error()"
requires:
  - "constants/theme.ts T.fab (posé par 02-01)"
  - "lib/haptics.ts (Phase 1) — haptics.press()/error()"
affects:
  - "components/map/PointMarker.tsx"
  - "app/(app)/map/index.tsx"
key-files:
  modified:
    - components/map/PointMarker.tsx
    - app/(app)/map/index.tsx
decisions:
  - "Sélection marker = swap de variante + PointAnnotation.refresh() (jamais reanimated dans le snapshot natif)"
  - "Cascade d'apparition = montage staggered (slice), pas d'opacité animée intra-snapshot"
  - "FAB = reanimated v4 (vraie View RN) — withSpring sur transform:scale uniquement"
metrics:
  tasks: 3
  files: 2
  completed: 2026-06-01
---

# Phase 2 Plan 03 : Markers raffinés + sélection + cascade + FAB squircle Summary

Markers retravaillés sur `PointAnnotation` (pin raffiné, sélection agrandie+halo via re-snapshot `refresh()`, cascade par montage staggered) et FAB refondu en squircle iOS animé (reanimated `withSpring` sur scale + `haptics.press()`), dans la contrainte snapshot natif de Mapbox.

## Objective atteint

Tranche visible : pins plus nets, sélection tactile au tap (agrandissement + halo rose immédiat), apparition en cascade au chargement, et un FAB non-Material (squircle 56/r18) qui réagit au toucher avec haptique — le tout en respectant la contrainte snapshot de `PointAnnotation` (re-snapshot via `refresh()`, montage staggered, AUCUNE transform animée dans les enfants de l'annotation).

## Modifications

### Task 1 — `components/map/PointMarker.tsx` (commit 682fe15)
- **`PinIcon` raffiné (D-05)** : tête 24×24 r12 (fond `T.bg`, bord 2px `T.primary`), point intérieur 9×9, tige 2×8, point bas 4×4, halo statique léger (`shadowColor:T.primary, shadowRadius:6, shadowOpacity:0.5, shadowOffset:{0,0}` — figé dans le snapshot).
- **`PinIconSelected` ajouté (D-06)** : anneau halo 44×44 (`rgba(255,45,135,0.12)` fond, `1px rgba(255,45,135,0.45)` bord) derrière une tête agrandie 30×30 (≈×1.25), point intérieur 11×11.
- **État sélectionné par RE-SNAPSHOT** : `useRef<MapboxGL.PointAnnotation>` + `useState(selected)` + `useEffect(() => annRef.current?.refresh(), [selected])`. Annotation câblée avec `ref`, `selected`, `onSelected` (→ selected=true + ouverture Modal) et `onDeselected` (→ selected=false). Enfant conditionnel `{selected ? <PinIconSelected/> : <PinIcon/>}`.
- **Conservé** : `anchor={{x:0.5,y:1}}`, `id={point.id}`, Modal preview INCHANGÉE (sheet natif = Phase 3), aucune réintroduction de `MarkerView` (régression projet — reste uniquement dans le commentaire de garde).

### Task 2 — `app/(app)/map/index.tsx` cascade (commit 50d91ca)
- **Hook `useStaggeredVisible(count)`** (`STAGGER_MS=40, CAP_MS=320, MAX_STAGGERED=30`) : révèle progressivement les premiers markers via `setTimeout` (delay `min(i*40, 320)`), monte le reste d'un coup à `CAP_MS`, nettoie les timers au cleanup (mitigation T-02-03 DoS : plafond + cleanup).
- **Rendu `points.slice(0, visibleCount).map(...)`** — la cascade vient du MONTAGE échelonné, pas d'une opacité animée intra-snapshot (Pitfall 1).
- **`haptics.error()`** ajouté à la branche d'échec de chargement (`if (!ok)`).
- **Exclusivité toggle conservée** : le slice reste sous `viewMode === 'pins'` ; en heatmap, aucun marker. Le stagger est keyé sur `points.length` → ne se réinitialise pas à l'ouverture de la preview (jamais de carte sans pins pendant la Modal).

### Task 3 — `app/(app)/map/index.tsx` FAB (commit 3dac715)
- **FAB squircle (UI-02/D-11/D-12)** : 56×56, `borderRadius: T.fab` (18) + `borderCurve:'continuous'` INLINE (discipline D-12), fond `T.primary`, `IcoPlus size={24} color={T.text}`, glow `shadowOffset:{0,6}, shadowOpacity:0.35, shadowRadius:16, elevation:8`.
- **Micro-anim reanimated v4** (le FAB est une vraie View RN) : `useSharedValue(1)` + `useAnimatedStyle` sur `transform:[{scale}]`, `onPressIn → withSpring(0.92)`, `onPressOut → withSpring(1, {damping:14, stiffness:220})`. `TouchableOpacity` remplacé par `Pressable` enveloppé dans `Animated.View`.
- **`haptics.press()`** dans `handleFabPress` + `accessibilityLabel="Inscrire un moment"`.
- **Position et gate inchangés** : `right:20, bottom: insets.bottom + 80`, masqué sous `viewingFriendId`. Styles scindés `fabWrap` (position) / `fab` (squircle visuel).

## Vérification

- `npx tsc --noEmit` : **38 erreurs baseline inchangées (0 nouvelle)** ; 0 erreur attribuable à PointMarker.tsx ni à map/index.tsx (les deux fichiers cible étaient sans erreur baseline et le restent).
- Assertions rg (par task) toutes vertes :
  - `PinIconSelected` matche · `.refresh()` dans `useEffect([selected])` · `onSelected|onDeselected|selected=` couverts · `MarkerView` absent en rendu actif · aucun reanimated/Animated dans les enfants de l'annotation.
  - `useStaggeredVisible|STAGGER_MS|MAX_STAGGERED` matche · `.slice(0,` matche · `haptics.error` dans la branche erreur · rendu sous `viewMode === 'pins'`.
  - `borderCurve` + `T.fab` sur le style FAB · `withSpring|useSharedValue|useAnimatedStyle` matche · `haptics.press` dans handleFabPress · `accessibilityLabel="Inscrire un moment"` · plus aucun `borderRadius: 0`.
- `borderCurve:'continuous'` compile proprement sous RN 0.81.5 (type `ViewStyle` ≥ RN 0.71).

## Validation device en attente (gate de phase)

Pas de framework de test (RN, surface native non testable unitairement). Validation manuelle requise sur **device physique / TestFlight** (Pitfall 5 — le simulateur n'est pas autoritaire pour le rendu rnmapbox) :
- Pins visibles à TOUS les zooms (garde de régression STAB-02).
- Tap pin → agrandissement + halo rose immédiat (re-snapshot `refresh()`).
- Chargement → cascade staggered ; la preview ne clignote jamais sans pins.
- FAB squircle (ni carré ni cercle Material) ; scale-on-press visible ; haptique medium au tap.

## Déviations par rapport au plan

Aucune — plan exécuté exactement comme écrit. Aucun paquet installé. Aucune fonctionnalité critique manquante détectée (rendu + contrôle FAB, données via hook existant sous RLS, aucune nouvelle surface de confiance).

## Known Stubs

Aucun. Les deux fichiers branchent des données et comportements réels (markers depuis le hook `usePoints`, FAB → route de création).

## Self-Check: PASSED

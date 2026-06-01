# Phase 2: Carte stylisée — Research

**Researched:** 2026-06-01
**Domain:** React Native / Expo SDK 54 map surface — `@rnmapbox/maps` 10.3.1 (custom style, heatmap, native annotations) + iOS rounded-shape design pivot (`borderCurve`)
**Confidence:** HIGH

> **Scope note.** This file does NOT re-derive project stack/architecture/pitfalls — those live in `.planning/research/STACK.md`, `ARCHITECTURE.md`, `PITFALLS.md` and are reused verbatim. This research resolves the **4 phase-specific unknowns** flagged for planning, and translates the (already-approved) `02-UI-SPEC.md` contract into a prescriptive, source-verified implementation brief. The UI-SPEC already locks every hex stop, opacity curve, radius value and FAB spec; treat it as the design source of truth and this file as the **technical feasibility + "do X / avoid Y"** layer.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Carte sombre **mais lisible** — rues/labels visibles en sombre/désaturé. Conserver grandes artères + quartiers/villes ; retirer labels mineurs.
- **D-02:** Touches rose **subtiles désaturées** sur la carte (eau, grands axes). Le rose vif `#ff2d87` reste réservé aux markers/heatmap.
- **D-03:** Fond **anthracite quasi-noir** (proche `T.bg` #000), PAS le bleu nuit `#0d1a2e`.
- **D-04:** Production du style = **checkpoint humain** : Claude fournit la recette Studio, l'utilisateur la reproduit dans Mapbox Studio, publie, fournit l'URL `mapbox://styles/...` → injectée dans `EXPO_PUBLIC_MAPBOX_STYLE`. Le code ne change qu'une URL (déjà câblé).
- **D-05:** Raffiner le pin actuel (tête ronde bord rose + tige), pas de nouvelle forme.
- **D-06:** État sélectionné = agrandissement + halo rose au tap (avant ouverture preview).
- **D-07:** Animation d'apparition = pop/scale-up en cascade. **Repli VERROUILLÉ = fondu simple** si la recherche montre que `PointAnnotation` (snapshot natif) ne permet pas le scale.
- **D-08:** Heatmap rose→ambre (ambre = forte concentration), sur `heatmap-density`.
- **D-09:** Opacité décroissante au zoom proche → lueur douce (pas un aplat, pas une disparition).
- **D-10:** Bandeau de contrôles éditorial repensé. **Lisibilité > blur lourd** (règle 13 CLAUDE.md).
- **D-11:** Haptic `press()` (impact medium) + micro-animation au tap du FAB.
- **D-12 (CROSS-PHASE 2→5, IMPORTANT):** Abandon « angles francs / borderRadius:0 » → formes iOS arrondies (squircle / `borderCurve:'continuous'`). FAB = squircle. Réviser tokens de rayon (`theme.ts`) ET §Identité visuelle de `CLAUDE.md` comme **tâche Phase 2**.

### Claude's Discretion
- Valeurs hex exactes du dégradé heatmap + courbe d'opacité par zoom → **figées dans UI-SPEC** (ne plus re-litiger).
- Détails de la spec Mapbox Studio (hex par calque, intensité rose désaturé) → **figés dans UI-SPEC**.
- Mapping haptique fin des contrôles (toggle, recentrer) → **figé dans UI-SPEC** (`select`/`tap`).
- Forme exacte du FAB (rond vs squircle) + échelle de rayons iOS → **figés dans UI-SPEC** (squircle 56/r18, `radiusXs..Xl`).

### Deferred Ideas (OUT OF SCOPE)
- **Clustering** des points proches (MAP-V2-01) — reporté v2. NE PAS planifier de migration `PointAnnotation`→`ShapeSource`/`CircleLayer`.
- **Refonte de la preview au tap** en bottom sheet natif → Phase 3 (IOS-01). Phase 2 **garde la `Modal` custom existante**.
- **Réévaluation des avatars carrés / inputs underline** → Phase 5 / Phase 3. NE PAS arrondir les avatars ni toucher aux inputs en Phase 2.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **MAP-01** | Style Mapbox sur-mesure noir/rose (Studio), injecté via `EXPO_PUBLIC_MAPBOX_STYLE`, labels minimalistes | Unknown #4 — swap d'URL OTA-safe, **aucun rebuild natif** ; checkpoint humain (Studio). Recette de style verrouillée dans UI-SPEC §Mapbox Studio. |
| **MAP-02** | Heatmap rose→ambre, opacité décroissante aux zooms élevés | Unknown #2 — `heatmapColor` interpolate-on-`heatmap-density`, `heatmapOpacity` interpolate-on-`zoom` ; cast `as any` (pattern établi). Stops exacts verrouillés UI-SPEC §Heatmap. |
| **MAP-03** | Markers retravaillés (état sélectionné + animation d'apparition) sur `PointAnnotation` | Unknown #1 — **verdict de faisabilité** : sélection/scale via re-render + `refresh()` (re-snapshot) ; apparition via **mount staggered** ; reanimated transforms sur enfants = no-op (snapshot). |
| **UI-02** | Écran carte + FAB refondus (contrôles éditoriaux, FAB non-Material) | Unknown #3 — `borderCurve:'continuous'` supporté iOS (RN ≥ 0.71) ; FAB squircle 56/r18 ; tokens de rayon `theme.ts` + révision CLAUDE.md. |
</phase_requirements>

---

## Summary

Phase 2 is a **visual / native-rendering** phase with a locked design contract (`02-UI-SPEC.md`, 6/6 approved). The technical risk is concentrated in exactly **one** place — animating markers rendered through `@rnmapbox/maps` `PointAnnotation`, which captures its React children as a **static bitmap snapshot**. The official rnmapbox docs are unambiguous: reanimated transforms (scale/translate) and even `Image` fade animations inside a `PointAnnotation` child **do not animate live** — they get frozen at snapshot time. This is why the UI-SPEC already locked the safe fallback (staggered opacity, scale as a "bonus only if a spike proves it"). This research confirms that verdict and gives the planner a concrete, reliable pattern so it does **not** plan a reanimated-driven marker animation that silently no-ops.

The other three unknowns resolve cleanly and low-risk: the **heatmap** keeps its current `ShapeSource`+`HeatmapLayer` structure (only the color/opacity/radius expressions change to the locked stops, `as any` cast retained); **`borderCurve:'continuous'`** is a first-class iOS RN style prop (since RN 0.71, the project is on 0.81.5) that composes with `borderRadius` and is a harmless no-op on Android and on full-circle shapes; and the **custom Studio style** is a pure remote-URL swap — OTA-safe, **no native rebuild**, gated only by the human Studio checkpoint (D-04).

**Primary recommendation:** Build markers with **state-driven variant swapping + `PointAnnotation.refresh()`** for the selected/enlarged state, and **staggered mounting** for the appearance cascade. Apply `borderCurve:'continuous'` alongside every `borderRadius ≥ radiusSm` per D-12. Treat MAP-01 as a human checkpoint task. Do **not** introduce clustering, MarkerView-on-the-mass, or any new package.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Custom map base style (MAP-01) | Mapbox Studio (remote service) | App config (`styleURL`) | Style is authored & hosted in Studio; app only references a URL. D-04 checkpoint. |
| Heatmap render (MAP-02) | Native map engine (`HeatmapLayer` GPU) | JS (GeoJSON build, memoized) | Color/opacity are GL style expressions evaluated on the GPU, not JS. |
| Marker render + selection (MAP-03) | Native annotation (`PointAnnotation` bitmap) | JS/React (child View, `refresh()`, mount timing) | Children are snapshotted natively; JS controls *what* gets snapshotted and *when*. |
| Marker/FAB micro-animation (D-07/D-11) | UI thread (reanimated worklet) — **FAB only** | JS | reanimated works on a **real RN View** (the FAB), NOT inside a PointAnnotation snapshot. |
| Control band + FAB shape (UI-02/D-12) | JS/React Native (styles, `borderCurve`) | Design tokens (`theme.ts`) | Pure RN styling on overlay Views above the map. |
| Haptics (D-10/D-11) | Native (`expo-haptics` via `lib/haptics.ts`) | JS | Fire-and-forget bridge calls. |

---

## The 4 Critical Unknowns — Resolved

### Unknown #1 — PointAnnotation animation feasibility (MAP-03) · **HIGH confidence**

**Question:** Can the selected-state (scale 1.25 + halo) and the appearance animation (pop/scale-up) work on `PointAnnotation` in SDK 54 + New Architecture? What is the reliable pattern?

**Verdict — the snapshot is the hard constraint:**

`PointAnnotation` renders its React children **onto a bitmap** (a native canvas snapshot), then displays that bitmap on the map. The official doc states it directly: *"PointAnnotation will render children onto a bitmap"* and *"disable any kind of animations like `fadeDuration` of `Image`. Otherwise, the bitmap might be rendered at an unknown state of the animation."* [CITED: github.com/rnmapbox/maps/blob/main/docs/PointAnnotation.md]

**Consequence:** A `react-native-reanimated` `scale`/`opacity`/`translate` worklet placed on a **child of `PointAnnotation` will not animate live** — the engine captures one frame and freezes it. Planning a reanimated-driven marker animation here would **silently no-op**. This confirms the UI-SPEC's locked fallback. [VERIFIED: official rnmapbox docs + issue corpus #1535/#2890/#1309]

**The reliable mechanism that DOES work — `refresh()` + the `selected` prop:**

The doc exposes a `refresh()` method on the `PointAnnotation` ref: *"To rerender the image from the current state of the view call `refresh`."* It also exposes a controlled `selected` boolean prop (*"Manually selects/deselects annotation"*) plus `onSelected` / `onDeselected` callbacks. [CITED: github.com/rnmapbox/maps/blob/main/docs/PointAnnotation.md]

So the **selected/enlarged state (D-06) is achievable** — not by animating, but by **re-snapshotting a different child variant**:

1. `onSelected` fires → set local `selected = true`.
2. The child renders the **larger variant** (head 30×30, halo ring 44×44) instead of the rest variant (head 24×24). This is a static appearance change, fully compatible with the bitmap model.
3. Call `annotationRef.current?.refresh()` after the variant changes so the new bitmap is captured (a state-driven re-render alone is historically unreliable for re-snapshot on some platforms — issue #2890 "content not re-rendered after data" — so call `refresh()` explicitly).

> **DO:** selected state = swap child variant + `refresh()`. **AVOID:** reanimated transform on PointAnnotation children. This is a discrete "small → large" pop, not a smooth tween — which matches the locked design (re-render variant, not animated transform; UI-SPEC §Markers).

**Appearance animation (D-07) — the locked fallback, realized correctly:**

The UI-SPEC locks "staggered opacity fade (280ms, `index×40ms` cap 320ms), scale-up a bonus only if a spike proves it." Important nuance the planner must understand: **an opacity tween *inside* the snapshot also won't animate** (same bitmap freeze). The reliable way to produce the cascade is **staggered mounting** — render the Nth `PointAnnotation` after `index × 40ms` (capped), so pins *appear* in a wave rather than fade via an animated value. Each pin "pops in" by being mounted; the perceived effect is the cascade D-07 asks for, without depending on intra-snapshot animation.

- **Reliable (plan this):** staggered **mount** of pins (cap total stagger ~320ms; cap the number of staggered pins, e.g. first ~30, mount the rest immediately to avoid a long tail on dense maps).
- **Bonus, dev-spike only (do NOT plan as a dependency):** a true scale-up "pop." If wanted, the *only* place reanimated genuinely animates is on a **`MarkerView`** (a real RN overlay, not a snapshot) — but `MarkerView` carries the **known project regression** (markers disappeared on zoom re-tile → that's exactly why the project migrated to `PointAnnotation`; see `PITFALLS.md` and code comment in `PointMarker.tsx`). So **do not** reintroduce `MarkerView` for the marker mass. If the scale-pop bonus is attempted, scope it to a throwaway spike and abandon on any zoom-disappearance.

**Nested-children concern is empirically resolved for this stack:** Issue #3682 reports *"PointAnnotation throwing an error with nested children on RN 0.76 + New Architecture."* The current production code (`PointMarker.tsx`) already renders a **nested-View** `PinIcon` inside `PointAnnotation` and ships successfully on builds #16+ (SDK 54, RN 0.81.5, New Arch). [VERIFIED: codebase + STATE.md build history] → The nested-children crash does not reproduce on the project's stack; the refined pin (also nested Views) is safe.

**Planner directives:**
- Implement `selected` via `onSelected`/`onDeselected` → local state → variant swap → `ref.refresh()`.
- Implement appearance via **staggered mount**, not an animated opacity value.
- Keep a `ref` per `PointAnnotation` (e.g. `useRef` map or per-marker component holding its own ref) to call `refresh()`.
- Validate on **physical iOS device / TestFlight** — snapshot timing and `refresh()` behavior differ on simulator (consistent with the project's device-validation rule).

---

### Unknown #2 — Mapbox heatmap expression syntax (MAP-02) · **HIGH confidence**

**Question:** Confirm the exact `heatmapColor` (interpolate on `heatmap-density`) and `heatmapOpacity` (interpolate on `zoom`) forms for the locked gradient, with rnmapbox typing caveats.

**Verdict:** The current `HeatmapLayer.tsx` structure is already correct (`ShapeSource` + `HeatmapLayer`, `as any` on the `style` object). Only the **expression values** change to the UI-SPEC-locked stops. Confirmed against Mapbox style-spec and existing `STACK.md` research. [CITED: docs.mapbox.com/style-spec/reference/layers]

Hard constraints (both already satisfied by current code, must remain):
- `heatmapColor` **must** interpolate on `['heatmap-density']` (input 0..1), and the **first stop at `0` must be transparent** (`rgba(0,0,0,0)`) — otherwise the whole map tints. [VERIFIED: Mapbox style-spec + STACK.md]
- `heatmapColor` is **not** data-driven (cannot vary per feature). `heatmapWeight` is the per-feature channel (`weight = note/10`, unchanged).
- rnmapbox's TS types do not model these GL expressions → the `style={{...} as any}` cast is the **established, accepted** pattern (already in `HeatmapLayer.tsx` and `AppMapView.tsx`). Keep it; do not fight the types.

Exact expressions to write (values from UI-SPEC §Heatmap — locked):

```tsx
// components/map/HeatmapLayer.tsx — style={{ ... } as any}
heatmapColor: [
  'interpolate', ['linear'], ['heatmap-density'],
  0.0, 'rgba(0,0,0,0)',            // transparent — REQUIRED first stop
  0.1, 'rgba(255,45,135,0.15)',    // rose froid (périphérie)
  0.3, 'rgba(255,45,135,0.55)',    // rose signature #ff2d87
  0.5, '#ff5a7a',                  // rose-corail
  0.7, '#ff8a4c',                  // corail-orange
  0.9, '#ffb020',                  // ambre chaud
  1.0, '#ffc24d',                  // ambre/or (cœur dense)
],
heatmapOpacity: [
  'interpolate', ['linear'], ['zoom'],
  10, 0.85, 13, 0.80, 15, 0.55, 17, 0.35, 19, 0.25,   // décroissante → lueur douce
],
heatmapRadius: ['interpolate', ['linear'], ['zoom'], 10, 22, 14, 44, 18, 70],
heatmapWeight: ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],   // note/10, inchangé
heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.4],
```

> Centralize the ambre data-viz hex (`#ffb020`/`#ffc24d`/`#08080a` map base) in `constants/config.ts` per UI-SPEC §Color (they are data-viz constants, intentionally outside the dark/light `T` tokens). Keep the GeoJSON `useMemo` (already present) to avoid rebuilding the FeatureCollection each render (perf, `PITFALLS.md` §perf).

---

### Unknown #3 — `borderCurve:'continuous'` (D-12 squircle) · **HIGH confidence**

**Question:** Confirm RN support on iOS for `borderCurve`, how it composes with `borderRadius`, caveats for the FAB / control surfaces.

**Verdict:** `borderCurve` is a **first-class React Native iOS style prop** (added in **RN 0.71**, requires iOS 13+; the project is on **RN 0.81.5** → fully supported). It accepts `'continuous'` or `'circular'` and produces the Apple "squircle" continuous-corner look. [CITED: reactnative.dev/docs/view-style-props] [VERIFIED: RN 0.71 introduced it; project on 0.81.5]

Composition & caveats:
- **Composes with `borderRadius`:** set both — `borderRadius` defines the corner size, `borderCurve:'continuous'` defines the curve shape. Required together per UI-SPEC discipline (`borderRadius ≥ radiusSm ⇒ borderCurve:'continuous'`).
- **No-op on full circles:** when `borderRadius ≥ half the smaller dimension` (i.e. a perfect circle / `pill: 999`), `borderCurve` has no visual effect. Harmless — for the `pill` token it's simply ignored. [CITED: nativewind discussion #1734]
- **FAB math is safe:** FAB is 56×56 with `borderRadius:18` → 18 < 28, so it is **not** a circle and `borderCurve:'continuous'` **applies** (the intended squircle). 
- **Android:** the prop is **iOS-only** and **silently ignored** on Android (no crash). Acceptable — the project is iOS-first (web is a stub). No cross-platform shim needed.
- **It is a per-style prop, NOT a theme token.** The planner adds `borderCurve:'continuous'` **inline in `StyleSheet`** objects on each rounded surface. `theme.ts` stores only the radius **numbers** (`radiusXs..Xl`, `fab`, revised `cardRadius`/`pill`). Do not try to put `borderCurve` in the `Theme` type.

**theme.ts changes (from UI-SPEC §D-12 — locked):**
- Extend `Theme` type with `radiusXs/Sm/Md/Lg/Xl: number` + `fab: number` (same values dark & light).
- Values: `radiusXs:8, radiusSm:12, radiusMd:16, radiusLg:22, radiusXl:28, fab:18`.
- Revise existing: `cardRadius: 4 → 16` (back-compat: existing readers round gently), `pill: 4 → 999`.
- This is an **explicit Phase 2 task**, alongside revising the `CLAUDE.md` §Identité visuelle conventions (« angles francs » → formes arrondies). Do **not** round avatars or inputs (UI-SPEC keeps them unchanged this phase).

---

### Unknown #4 — Custom Mapbox Studio style URL injection (MAP-01) · **HIGH confidence**

**Question:** Confirm `styleURL` swap via `EXPO_PUBLIC_MAPBOX_STYLE` is runtime/OTA-safe (no native rebuild), and the human-checkpoint nature.

**Verdict:** Correct — swapping the style is a **remote-URL change**, not a native config change. The map loads the style from Mapbox's servers at runtime via `styleURL={APP_CONFIG.MAPBOX_STYLE}` (already wired in `AppMapView.tsx`). Creating/editing the style in Studio changes **nothing in the binary**. [VERIFIED: STACK.md + codebase `AppMapView.tsx` line 95]

Two precise nuances the planner must encode:

1. **`EXPO_PUBLIC_*` is inlined at bundle time, not read from device env at runtime.** Changing `.env.local` only takes effect when the **JS bundle is rebuilt**. Therefore: an **`eas update` (OTA) rebundles JS with the new inlined URL → the style swap IS OTA-deliverable** on the current runtime, with **no native rebuild and no `runtimeVersion` bump** (this is a pure-JS change, the safe category per `PITFALLS.md` §runtimeVersion). The `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (`sk.*`, native SDK download) and the runtime `pk.*` token are **unaffected** and need no change.
2. **Token scope:** the existing public `pk.*` token (`EXPO_PUBLIC_MAPBOX_TOKEN`) loads a private custom style fine (default `styles:read` scope). No token change needed. [VERIFIED: STACK.md]

**Human checkpoint (D-04):** The user must (a) build the style in Mapbox Studio from the UI-SPEC §Mapbox Studio recipe (base: Mapbox Dark; layer hex table; label density rules), (b) publish, (c) paste the `mapbox://styles/<user>/<id>` URL into `EXPO_PUBLIC_MAPBOX_STYLE`. → Plan this as a **`checkpoint:human-verify`** task that **gates the end-to-end MAP-01 verification** but does **not block** the code-side tasks (heatmap/markers/controls/FAB), which can proceed against the current `dark-v11` fallback URL.

---

## Standard Stack

**No new packages.** Everything needed is already installed (Phase 1 added reanimated v4 + gesture-handler). This phase touches existing components and styling only.

| Library | Installed Version | Purpose in Phase 2 | Notes |
|---------|-------------------|--------------------|-------|
| `@rnmapbox/maps` | **10.3.1** [VERIFIED: node_modules] | Map, `HeatmapLayer`, `PointAnnotation`, `styleURL` | API surface confirmed against official docs |
| `react-native` | **0.81.5** [VERIFIED: node_modules] | `borderCurve:'continuous'` (RN ≥ 0.71) | iOS-only prop, ignored on Android |
| `react-native-reanimated` | **4.1.7** [VERIFIED: node_modules] | FAB micro-animation (scale on press) **only** | NOT usable inside PointAnnotation children |
| `react-native-gesture-handler` | installed (Phase 1) | available; not strictly required this phase | `Pressable` + reanimated suffices for FAB |
| `expo-haptics` (via `lib/haptics.ts`) | ~15.0.8 | FAB `press()`, toggle/friend `select()`, recenter `tap()` | helper from Phase 1 |

**Package Legitimacy Audit:** Not applicable — Phase 2 installs **zero** external packages. All dependencies pre-exist and were vetted in Phase 0/1.

---

## Architecture Patterns

### Data flow (conceptual)

```
EXPO_PUBLIC_MAPBOX_STYLE (env, inlined at bundle)
        │
        ▼
APP_CONFIG.MAPBOX_STYLE ──► AppMapView <MapboxGL.MapView styleURL>
                                  │
        ┌─────────────────────────┼──────────────────────────┐
        ▼                         ▼                          ▼
  viewMode === 'heatmap'    viewMode === 'pins'        overlay Views (above map)
        │                         │                          │
  <HeatmapLayer>            points.map(PointMarker)     ControlBand + FAB + Recenter
  ShapeSource+HeatmapLayer   PointAnnotation (bitmap)    (RN styles: borderRadius
  (GL expressions, GPU)      ├ onSelected → selected     + borderCurve:'continuous')
                             ├ variant swap + refresh()  FAB: reanimated scale + haptics.press()
                             └ staggered mount (cascade)
```

> Toggle pins/heatmap is **mutually exclusive** (UI-SPEC / D-09): in heatmap mode, render no `PointMarker`s.

### Pattern 1 — Selected marker via variant swap + `refresh()`
**What:** Discrete enlarge+halo on tap, snapshot-compatible.
**When:** MAP-03 selected state (D-06).
```tsx
// PointMarker.tsx (sketch — adapt to existing file)
const annRef = useRef<MapboxGL.PointAnnotation>(null);
const [selected, setSelected] = useState(false);

useEffect(() => { annRef.current?.refresh(); }, [selected]); // re-snapshot after variant change

<MapboxGL.PointAnnotation
  ref={annRef}
  id={point.id}
  coordinate={[point.longitude, point.latitude]}
  anchor={{ x: 0.5, y: 1 }}
  selected={selected}
  onSelected={() => { setSelected(true); setModalVisible(true); }}
  onDeselected={() => setSelected(false)}
>
  {selected ? <PinIconSelected T={T} /> : <PinIcon T={T} />}
</MapboxGL.PointAnnotation>
```
Source pattern basis: [CITED: github.com/rnmapbox/maps/blob/main/docs/PointAnnotation.md — `refresh()`, `selected`, `onSelected`/`onDeselected`].

### Pattern 2 — Appearance cascade via staggered mount
**What:** Pins "pop in" in a wave (the reliable form of D-07).
```tsx
// In the map screen: gate rendering of each marker by a per-index delay.
const STAGGER_MS = 40, CAP_MS = 320, MAX_STAGGERED = 30;
function useStaggeredVisible(count: number) {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    let n = 0; const timers: ReturnType<typeof setTimeout>[] = [];
    const staggered = Math.min(count, MAX_STAGGERED);
    for (let i = 0; i < staggered; i++) {
      timers.push(setTimeout(() => setVisible(v => Math.max(v, i + 1)),
        Math.min(i * STAGGER_MS, CAP_MS)));
    }
    if (count > staggered) timers.push(setTimeout(() => setVisible(count), CAP_MS));
    return () => timers.forEach(clearTimeout);
  }, [count]);
  return visible;
}
// render points.slice(0, visible).map(p => <PointMarker .../>)
```
> Cap the staggered count so dense maps don't get a long mount tail. Never leave the map pinless while the preview is open (UI-SPEC: "la preview ne doit jamais clignoter sans pins").

### Pattern 3 — FAB squircle + reanimated press + haptics
```tsx
// reanimated WORKS here — the FAB is a real RN View, not a snapshot
const scale = useSharedValue(1);
const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
<Animated.View style={aStyle}>
  <Pressable
    accessibilityLabel="Inscrire un moment"
    onPressIn={() => { scale.value = withSpring(0.92); }}
    onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
    onPress={() => { haptics.press(); router.push('/(app)/point/new'); }}
    style={{ width: 56, height: 56, borderRadius: T.fab, borderCurve: 'continuous',
             backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center',
             shadowColor: T.primary, shadowOffset: { width: 0, height: 6 },
             shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 }}>
    <IcoPlus size={24} color={T.text} />
  </Pressable>
</Animated.View>
```

### Anti-Patterns to Avoid
- **reanimated/`Animated` transform inside `PointAnnotation` children** → snapshot freezes it; no animation. (Unknown #1.)
- **Reintroducing `MarkerView` for the marker mass** → known project regression (disappears on zoom re-tile). (PITFALLS / code comment.)
- **`BlurView` on the control band** → CLAUDE.md rule 13 (hurt tab-bar readability). Use `T.surface` at ~0.92 alpha. (UI-SPEC §Bandeau.)
- **Planning clustering / `ShapeSource`+`CircleLayer` migration** → explicitly deferred (MAP-V2-01). Out of scope.
- **`borderCurve` in the `Theme` type** → it's a per-style prop, not a token.
- **`heatmapColor` without a transparent stop at density 0** → tints the whole map.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Squircle / continuous corners | A custom SVG/clip-path squircle, or `react-native-continuous-corners` | Native RN `borderCurve:'continuous'` + `borderRadius` | First-class iOS prop on RN 0.81.5; zero deps, zero perf cost. |
| Heatmap gradient | Manual per-point colored circles | `HeatmapLayer` GL expressions on `heatmap-density` | GPU-evaluated; the only correct way to do density-based color. |
| Re-render a selected marker bitmap | Force-remount the annotation / key hacks | `PointAnnotation.refresh()` + `selected` prop | Official API for re-snapshotting; remount hacks flicker. |
| Marker appearance animation | reanimated tween inside the snapshot | Staggered **mount** timing | Intra-snapshot animation is frozen; mount timing is reliable. |
| FAB press animation | `Animated` (legacy) on layout props | reanimated `withSpring` on `transform: scale` only | Compositor-friendly; reanimated already installed. |

**Key insight:** On this map surface, the platform already owns the hard parts (GL heatmap, native squircle, native snapshot lifecycle). The job is to **drive** these correctly, not reimplement them. The single genuinely fiddly thing — marker animation — is constrained by the snapshot model, so the design (correctly) leans on discrete state changes rather than tweens.

---

## Runtime State Inventory

> Phase 2 is mostly styling/code, but MAP-01 introduces external service state. Other categories verified empty.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no DB schema/key changes (markers/heatmap read existing `points`). | None. |
| **Live service config** | **Mapbox Studio custom style** — authored in Studio (NOT in git). The `mapbox://styles/<user>/<id>` URL lives only in `EXPO_PUBLIC_MAPBOX_STYLE` (`.env.local`, not committed) + EAS env. | **Human checkpoint (D-04):** user builds style in Studio per UI-SPEC recipe, publishes, supplies URL. Plan as `checkpoint:human-verify`. |
| OS-registered state | None — no Task Scheduler / launchd / pm2 equivalents (mobile app). | None. |
| Secrets/env vars | `EXPO_PUBLIC_MAPBOX_STYLE` (value changes; **inlined at bundle time** — needs JS rebundle/OTA to take effect). `EXPO_PUBLIC_MAPBOX_TOKEN` (`pk.*`) unchanged. `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (`sk.*`) unchanged. | Update `.env.local` + EAS env with the Studio URL once produced. No native rebuild for the URL change. |
| Build artifacts | None new. `borderCurve`/styles/heatmap/markers are pure JS — OTA-deliverable on current runtime (no native module added → no `runtimeVersion` bump). | None (unless an unrelated native change lands). |

**The canonical question — "after every file is updated, what runtime state still holds the old value?"** → Only the **Mapbox Studio style** (until the user publishes the new one) and the **bundled `EXPO_PUBLIC_MAPBOX_STYLE` value** (until a rebundle/OTA carries the new URL). Both are covered by the D-04 checkpoint task.

---

## Common Pitfalls

> Phase-specific. Full cross-cutting catalogue (sheets, gestures, runtimeVersion, dark/light, Dynamic Type, safe-area, FPS) lives in `.planning/research/PITFALLS.md` — reuse it.

### Pitfall 1 — Planning a marker animation that silently no-ops
**What goes wrong:** A reanimated scale/opacity worklet is added to the pin and "does nothing" on device.
**Why:** `PointAnnotation` snapshots its children to a bitmap.
**Avoid:** Use variant swap + `refresh()` (selection) and staggered mount (appearance). Treat the scale-pop as a discardable spike only.
**Warning sign:** Animation works in a plain RN sandbox but is frozen once the View is a PointAnnotation child.

### Pitfall 2 — `refresh()` not called after variant change
**What goes wrong:** Tapping a pin updates state but the bitmap doesn't change (stays small/no-halo).
**Why:** A React state change alone doesn't always re-trigger the native snapshot (issue #2890).
**Avoid:** Call `annRef.current?.refresh()` in a `useEffect` keyed on the variant/`selected` state.
**Warning sign:** Selected state visible after a pan/zoom but not immediately on tap.

### Pitfall 3 — Whole-map tint from a bad heatmap first stop
**What goes wrong:** Entire map shows a rose wash.
**Why:** `heatmapColor` density-0 stop isn't transparent.
**Avoid:** Keep `0.0, 'rgba(0,0,0,0)'` as the first stop (already correct in current code).

### Pitfall 4 — `EXPO_PUBLIC_MAPBOX_STYLE` change "not applying"
**What goes wrong:** User pastes the Studio URL but the old style still shows.
**Why:** `EXPO_PUBLIC_*` is inlined at bundle time; editing `.env.local` without a rebundle/OTA does nothing in an already-built binary.
**Avoid:** After setting the URL, ship an `eas update` (OTA, pure-JS, no runtimeVersion bump) or rebuild. Document this in the checkpoint task.

### Pitfall 5 — Device-only rendering truth
**What goes wrong:** Markers/heatmap/snapshot behave differently on simulator vs device.
**Why:** rnmapbox rendering and snapshot timing diverge on iOS simulator (consistent with project's existing device-validation rule).
**Avoid:** Validate MAP-01/02/03 on **physical iOS device / TestFlight**, never simulator-only.

---

## State of the Art

| Old approach (current code) | Phase 2 approach | Impact |
|-----------------------------|------------------|--------|
| Heatmap violet→`#e91e8c`→orange-rouge | rose→ambre on `heatmap-density`, opacity falloff on zoom | Brand-consistent "ember" gradient (D-08/D-09). |
| Pin: head 26×26, no selected state, no appearance anim | Refined pin (head 24/dot 9/stem 8) + selected variant (head 30 + halo) via `refresh()` + staggered mount | Tactile selection + cascade (D-05/06/07). |
| `borderRadius: 0` / `cardRadius: 4` (angles francs) | `borderCurve:'continuous'` + radius scale `radiusXs..Xl`, `cardRadius 16`, FAB squircle | iOS rounded-shape pivot (D-12, cross-phase). |
| Square FAB, no haptic, no anim | Squircle 56/r18, `haptics.press()`, reanimated scale-on-press | Non-Material FAB (UI-02/D-11). |
| Floating controls (`MapHeader` + recenter button) | Editorial semi-opaque control band (no BlurView) + detached recenter | Signature surface (D-10). |

**Deprecated/outdated for this phase:**
- `COLORS.mapBg = '#0d1a2e'` (the blue night) — **rejected by D-03**; map base is `#08080a` (Studio) — do not reference `mapBg`.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The staggered-**mount** cascade reads as the intended "pop-in" without a per-pin opacity tween. | Unknown #1 / Pattern 2 | Low — if it looks abrupt, add the bonus scale-pop spike; design already accepts mount-based fallback. |
| A2 | `MAX_STAGGERED ≈ 30` is a reasonable cap before mounting the rest at once. | Pattern 2 | Low — tune on device; purely a perf/feel knob, no correctness impact. |
| A3 | The refined nested-View pin won't hit issue #3682 (RN 0.76 New-Arch nested-children error). | Unknown #1 | Very low — production already ships a nested-View pin on PointAnnotation (builds #16+, RN 0.81.5). Empirically resolved. |

**All other claims are VERIFIED (codebase/node_modules) or CITED (official rnmapbox / Mapbox / React Native docs).**

---

## Environment Availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| `@rnmapbox/maps` | MAP-01/02/03 | ✓ | 10.3.1 | — |
| `react-native` borderCurve | UI-02/D-12 | ✓ | 0.81.5 (≥ 0.71) | — |
| `react-native-reanimated` | FAB micro-anim | ✓ | 4.1.7 | `Animated` (legacy) — not recommended |
| `expo-haptics` / `lib/haptics.ts` | D-10/D-11 | ✓ | ~15.0.8 | — |
| **Mapbox Studio custom style URL** | MAP-01 | ✗ (user-produced) | — | `dark-v11` fallback (current) until URL supplied — code tasks proceed meanwhile |
| Physical iOS device / TestFlight | MAP-01/02/03 validation | (user) | — | none — simulator is NOT authoritative for rnmapbox rendering |

**Missing dependency with fallback:** the Studio style URL (D-04 human checkpoint) — non-blocking for code tasks; gates only the end-to-end MAP-01 sign-off.

---

## Validation Architecture

> This RN project has **no automated test framework** (no `jest`/`jest-expo` in `package.json` — verified). Available automated gates are **`tsc --noEmit`** (typecheck) and **`eslint`** (lint). Phase 2 is predominantly visual/native rendering, which is **not unit-testable** (Mapbox is native-only; stubbed to `null` on web). Validation is therefore: static gates (no new errors) + a structured **manual device checklist** on TestFlight.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | none (no jest/jest-expo) — static analysis only |
| Config file | none — `tsconfig.json` (strict) + `eslint` flat/legacy config present |
| Quick run command | `npm run typecheck` (`tsc --noEmit`) |
| Full suite command | `npm run typecheck && npm run lint` |

> Baseline: ~39 pre-existing `tsc` errors (Supabase `never` types) per STATE.md. The gate is **zero NEW errors introduced**, not zero total.

### Phase Requirements → Validation Map
| Req | Behavior | Validation type | Command / Method | Automatable? |
|-----|----------|-----------------|------------------|--------------|
| MAP-01 | Custom style loads; labels minimal; dark+rose | manual (device) | TestFlight visual check vs UI-SPEC §Mapbox Studio after URL set | ❌ device-only |
| MAP-02 | Heatmap rose→ambre; opacity falls off on zoom | manual (device) + static | typecheck (expression compiles) + TestFlight zoom check | partial (compile only) |
| MAP-03 | Pin refined; selected = enlarge+halo; cascade on load | manual (device) | TestFlight: tap a pin → enlarge+halo; reload → cascade; pin visible at all zooms (STAB-02 regression guard) | ❌ device-only |
| UI-02 | Control band (no blur) + FAB squircle + press anim + haptic | manual (device) + static | typecheck/lint + TestFlight: FAB squircle shape, scale-on-press, medium haptic | partial |
| D-12 | `theme.ts` radius tokens + CLAUDE.md updated; `borderCurve` applied | static + manual | typecheck (Theme type extends cleanly) + grep that no new `borderRadius:0` introduced on refonted surfaces | partial |

### Sampling Rate
- **Per task commit:** `npm run typecheck` (no new errors).
- **Per wave merge:** `npm run typecheck && npm run lint`.
- **Phase gate:** static gates green **+** TestFlight manual checklist (MAP-01 after Studio URL; MAP-02/03/UI-02 on device) **+** STAB-02 regression check (pins visible at all zoom levels — this phase touches markers).

### Wave 0 Gaps
- [ ] No test files to scaffold — project has no test harness and this phase doesn't justify introducing one (visual/native surface). If a future phase wants unit coverage for pure helpers (e.g. `formatDuration`), `jest-expo` would be the standard choice — out of scope here.
- [ ] Author a short **manual TestFlight checklist** as a phase-gate artifact (one line per requirement above).

---

## Sources

### Primary (HIGH confidence)
- [rnmapbox PointAnnotation docs](https://github.com/rnmapbox/maps/blob/main/docs/PointAnnotation.md) — bitmap snapshot, `refresh()`, `selected`/`onSelected`/`onDeselected`, MarkerView recommendation. (Unknown #1)
- [React Native — View Style Props](https://reactnative.dev/docs/view-style-props) — `borderCurve` iOS prop. (Unknown #3)
- [Mapbox style-spec — layers (heatmap)](https://docs.mapbox.com/style-spec/reference/layers/) — `heatmapColor`/`heatmap-density`/`heatmapOpacity`. (Unknown #2)
- Codebase: `components/map/{AppMapView,HeatmapLayer,PointMarker}.tsx`, `constants/{theme,config}.ts`, `node_modules` versions. (VERIFIED)
- `.planning/research/{STACK,ARCHITECTURE,PITFALLS}.md` — reused project research. (VERIFIED prior)
- `.planning/phases/02-carte-stylis-e/02-UI-SPEC.md` — locked design contract. (VERIFIED)

### Secondary (MEDIUM confidence)
- [rnmapbox issue #2890 — PointAnnotation content not re-rendered](https://github.com/rnmapbox/maps/issues/2890) — motivates explicit `refresh()`.
- [rnmapbox issue #1309 — PointAnnotation custom child perf drop iOS](https://github.com/rnmapbox/maps/issues/1309) — snapshot cost context.
- [rnmapbox issue #3682 — nested children RN 0.76 New Arch](https://github.com/rnmapbox/maps/issues/3682) — checked against production (resolved on 0.81.5).
- [nativewind discussion #1734 — borderCurve composition / circle no-op](https://github.com/nativewind/nativewind/discussions/1734)

## Metadata

**Confidence breakdown:**
- Unknown #1 (PointAnnotation animation): HIGH — official docs explicit + production evidence on the exact stack.
- Unknown #2 (heatmap expressions): HIGH — Mapbox spec + already-working code structure.
- Unknown #3 (borderCurve): HIGH — RN docs + version math (0.81.5 ≥ 0.71).
- Unknown #4 (style URL OTA-safe): HIGH — codebase wiring + Expo env inlining model + STACK.md.
- Standard stack: HIGH — versions read from node_modules.

**Research date:** 2026-06-01
**Valid until:** ~2026-07-01 (stable; re-verify if `@rnmapbox/maps` or RN major changes).

---
phase: 02-carte-stylis-e
verified: 2026-06-01T00:00:00Z
status: passed
score: 4/4 must-haves verified
overrides_applied: 0
---

# Phase 2: Carte stylisée — Verification Report

**Phase Goal:** Transformer l'écran carte en surface éditoriale signature (style sur-mesure, heatmap raffinée, markers retravaillés).
**Verified:** 2026-06-01
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | La carte affiche un style Mapbox sur-mesure noir/rose avec labels minimalistes, injecté via `EXPO_PUBLIC_MAPBOX_STYLE` | VERIFIED | `APP_CONFIG.MAPBOX_STYLE` reads `EXPO_PUBLIC_MAPBOX_STYLE` (config.ts:4) → `styleURL` (AppMapView.tsx:99). Style JSON `lovemap-noir-rose.style.json` exists (29 layers, version 8). User confirmed render on build #19 (MANUAL-CHECKLIST MAP-01 ✓) |
| 2 | La heatmap utilise un dégradé rose→ambre et atténue son opacité aux zooms élevés | VERIFIED | `heatmapColor` interpolation: 7 stops from `rgba(0,0,0,0)` → rose (0.1/0.3) → corail (0.5/0.7) → `MAP_COLORS.emberAmber` (0.9) → `MAP_COLORS.emberGold` (1.0). `heatmapOpacity` zoom interpolation 0.85→0.25 (10→19). (HeatmapLayer.tsx:38-68). User confirmed on device (MANUAL-CHECKLIST MAP-02 ✓) |
| 3 | Les markers ont un design retravaillé avec état sélectionné et animation d'apparition | VERIFIED | `PinIcon` (head 24/stem 2/anchor 4, halo shadow) + `PinIconSelected` (ring 44×44 rgba(255,45,135,0.12) + head 30) in PointMarker.tsx. `PointAnnotation` ref + `refresh()` on selected state change. `useStaggeredVisible` (STAGGER_MS=40, CAP_MS=320) in map/index.tsx slice render. User confirmed on device (MANUAL-CHECKLIST MAP-03 ✓) |
| 4 | L'écran carte et son FAB sont refondus dans l'esprit éditorial (contrôles flottants, FAB non-Material) avec haptics au tap | VERIFIED | FAB: 56×56 squircle (`borderRadius:T.fab=18`, `borderCurve:'continuous'`), `withSpring` pressIn→0.92/pressOut→1.0, `haptics.press()`, `accessibilityLabel="Inscrire un moment"` (map/index.tsx:192-205). MapHeader: `rgba(10,10,10,0.92)` NO BlurView, `borderRadius:T.radiusLg=22`, `borderCurve:'continuous'`, `haptics.select()` on toggle. FriendSelector pill: `T.radiusXs`, `borderCurve`, `haptics.select()`. Recenter: squircle 40×40, `T.radiusSm`, `borderCurve`, `haptics.tap()`. User confirmed on device (MANUAL-CHECKLIST UI-02 ✓) |

**Score:** 4/4 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `constants/theme.ts` | Radius scale D-12: `radiusXs..Xl`, `fab=18`, `cardRadius=16`, `pill=999` in Theme type + dark + light | VERIFIED | All 6 new keys present in type, darkTheme, lightTheme with identical values. `cardRadius:16`, `pill:999`. No `borderCurve` in theme (correct — per-style prop per RESEARCH Unknown #3) |
| `CLAUDE.md §Identité visuelle` | D-12 pivot documented (formes iOS arrondies + borderCurve discipline + FAB squircle); avatars/inputs exceptions preserved | VERIFIED | Token table updated (cardRadius=16, radiusXs/Sm/Md/Lg/Xl, fab=18, pill=999). New convention line: "Formes (pivot D-12)" with borderCurve:'continuous' rule + squircle FAB. Avatars carrés + Inputs underline only explicitly preserved |
| `components/map/HeatmapLayer.tsx` | Ember gradient (rose→ambre), opacity decreasing by zoom, old gradient removed | VERIFIED | 7-stop rose→ambre gradient. `MAP_COLORS.emberAmber/emberGold` at top stops. Zoom opacity interpolation. `e91e8c/ff5722/156,39,176` absent |
| `components/map/PointMarker.tsx` | `PinIcon` raffiné + `PinIconSelected` variant + `PointAnnotation` ref + `refresh()` on selection | VERIFIED | Both pin variants implemented per spec (D-05/D-06). `useRef<MapboxGL.PointAnnotation>`, `useEffect(() => annRef.current?.refresh(), [selected])`. No `MarkerView` in active render |
| `app/(app)/map/index.tsx` | FAB squircle + reanimated spring + haptics; `useStaggeredVisible` + slice render | VERIFIED | FAB: T.fab, borderCurve, Animated.View + withSpring 0.92/1.0, haptics.press(). useStaggeredVisible + points.slice(0, visibleCount). haptics.error() on load fail |
| `components/map/MapHeader.tsx` | Floating band, rgba 0.92, NO BlurView, T.radiusLg + borderCurve, segmented toggle + haptics | VERIFIED | BAND_SURFACE='rgba(10,10,10,0.92)', borderRadius:T.radiusLg, borderCurve:'continuous', haptics.select() on mode change. Toggle segments: T.radiusSm/T.radiusXs + borderCurve |
| `components/map/FriendSelector.tsx` | Pill trigger: T.radiusXs + borderCurve + haptics.select() | VERIFIED | Trigger: borderRadius:T.radiusXs, borderCurve:'continuous'. haptics.select() in handleSelect |
| `components/map/AppMapView.tsx` | Recenter squircle: T.radiusSm + borderCurve + haptics.tap() + accessibilityLabel | VERIFIED | recenterButton: borderRadius:T.radiusSm=12, borderCurve:'continuous'. haptics.tap() in handleRecenter. accessibilityLabel="Recentrer sur ma position" |
| `constants/config.ts` | MAP_COLORS: emberAmber='#ffb020', emberGold='#ffc24d' | VERIFIED | `MAP_COLORS.emberAmber:'#ffb020'`, `MAP_COLORS.emberGold:'#ffc24d'`, `mapBaseDark:'#08080a'` |
| `.planning/phases/02-carte-stylis-e/lovemap-noir-rose.style.json` | Style JSON exists (Mapbox GL v8, noir/rose) | VERIFIED | File exists, version 8, sources composite (mapbox-streets-v8) + mapbox-dem, name "LoveMap Noir Rose" |
| `.planning/phases/02-carte-stylis-e/02-MANUAL-CHECKLIST.md` | Device validation verdict for all 4 requirements | VERIFIED | Global verdict: "Les 4 requirements visuels passent sur device (build #19) → Phase 2 validée." MAP-01 ✓ MAP-02 ✓ MAP-03 ✓ UI-02 ✓ |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `EXPO_PUBLIC_MAPBOX_STYLE` (env) | `styleURL` (AppMapView.tsx:99) | `APP_CONFIG.MAPBOX_STYLE` (config.ts:4) | WIRED | `MAPBOX_STYLE: process.env.EXPO_PUBLIC_MAPBOX_STYLE ?? 'mapbox://styles/mapbox/dark-v11'` → `styleURL={APP_CONFIG.MAPBOX_STYLE}` |
| `MAP_COLORS.emberAmber/emberGold` (config.ts) | `heatmapColor` stops 0.9/1.0 (HeatmapLayer.tsx) | Direct import | WIRED | `import { MAP_COLORS } from '@/constants/config'` → stops at densities 0.9 and 1.0 |
| `T.fab` (theme.ts) | FAB `borderRadius` (map/index.tsx) | `useTheme()` → `makeStyles(T)` | WIRED | `borderRadius: T.fab` in `fab` style |
| `T.radiusLg` (theme.ts) | MapHeader `borderRadius` | `useTheme()` → `makeStyles(T)` | WIRED | `borderRadius: T.radiusLg` in `container` style |
| `annRef.current?.refresh()` | PointAnnotation re-snapshot | `useEffect([selected])` | WIRED | `useEffect(() => { annRef.current?.refresh(); }, [selected])` — fires after every selected state change |
| `haptics.press()` | FAB `onPress` handler | `handleFabPress` | WIRED | `function handleFabPress() { haptics.press(); router.push(...) }` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `HeatmapLayer.tsx` | `points: MapPoint[]` prop | `usePoints()` hook → Supabase RPC/query (mapStore) | Yes — real DB points with weight = note/10 | FLOWING |
| `PointMarker.tsx` | `point: MapPoint` prop | Same hook/store | Yes | FLOWING |
| `map/index.tsx` | `points` from `usePoints()` | `fetchMyPoints` / `fetchFriendPoints` → Supabase | Yes | FLOWING |
| `MapHeader.tsx` | `pointCount`, `friendName` props | Passed from map/index.tsx (live state) | Yes | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: Device-only behaviors (Mapbox GPU, heatmap shader, marker snapshot, FAB spring feel) are NOT testable without a running iOS device. The user's device validation on build #19 (02-MANUAL-CHECKLIST.md "Validé", 2026-06-01) is treated as authoritative per verification instructions.

Static checks that can run without a device:

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| Theme tokens present and correct | File read — radiusXs:8, radiusSm:12, radiusMd:16, radiusLg:22, radiusXl:28, fab:18, cardRadius:16, pill:999 | All 8 values confirmed in both darkTheme and lightTheme | PASS |
| FAB borderCurve present | `borderCurve: 'continuous'` in map/index.tsx styles.fab | Confirmed at line 197 | PASS |
| No BlurView in MapHeader | BlurView absent from MapHeader.tsx imports and render | Confirmed — BAND_SURFACE is a plain rgba constant | PASS |
| Heatmap first stop transparent | `0.0, 'rgba(0,0,0,0)'` at density 0.0 (prevents global tint) | Confirmed at HeatmapLayer.tsx:42 | PASS |
| PointAnnotation (not MarkerView) | `MapboxGL.PointAnnotation` used; no active `MapboxGL.MarkerView` in render path | Confirmed — only PointAnnotation in render return | PASS |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MAP-01 | 02-05-PLAN.md | Style Mapbox sur-mesure noir/rose via EXPO_PUBLIC_MAPBOX_STYLE | SATISFIED | Style JSON + env wiring + user device confirm (build #19) |
| MAP-02 | 02-02-PLAN.md | Heatmap rose→ambre, opacité décroissante au zoom | SATISFIED | HeatmapLayer.tsx gradient + opacity interpolation verified |
| MAP-03 | 02-03-PLAN.md | Markers retravaillés, état sélectionné, animation d'apparition | SATISFIED | PinIcon + PinIconSelected + refresh() + useStaggeredVisible |
| UI-02 | 02-01/03/04-PLAN.md | Écran carte + FAB refondus (contrôles flottants, FAB non-Material, haptics) | SATISFIED | D-12 tokens + FAB squircle + MapHeader band + FriendSelector + Recenter |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| `components/map/PointMarker.tsx:202` | `(point as any).address` type cast | INFO | MapPoint type doesn't declare `address` field; cast avoids touching type definition. Functionally correct, minor tech debt. Not a stub — renders real data when present. |
| `components/map/HeatmapLayer.tsx:71` | `} as any}` on MapboxGL HeatmapLayer style | INFO | Required for Mapbox GL style expression types not fully typed in @rnmapbox/maps; standard pattern for this library. Not a code quality issue. |
| `CLAUDE.md phases table — GSD-P2 row` | Row shows "🔄 En cours" when phase is complete | INFO | Phase code is complete, build #19 submitted, device validated 2026-06-01. The GSD-P2 table row was not updated to ✅ Terminé after device validation. Stale documentation only — no code impact. |

No TBD, FIXME, or XXX markers found in any of the 8 source files modified by this phase.

---

### Human Verification Required

All human verification items for this phase have been completed by the user on 2026-06-01 using TestFlight build #19. The 02-MANUAL-CHECKLIST.md records the verdict:

> "Les 4 requirements visuels passent sur device (build #19) → Phase 2 validée."
> MAP-01 ✓ MAP-02 ✓ MAP-03 ✓ (pins tous zooms, STAB-02 OK) UI-02 ✓ (FAB squircle + haptique)

No pending human verification items.

---

### Deviations Accepted During Execution

**MAP-01 style label density**: The Mapbox Studio style was enriched beyond the minimal UI-SPEC recipe (14 layers → 29 layers: parks, hillshade relief, 3D buildings, POI pastilles, transit) at the user's explicit request ("plus de vie"). The core identity (anthracite #08080a base, rose-prune water #241019, rose-brown axes #3a2630, D-02/D-03 principles) is preserved. User confirmed the enriched render as "Validé" on device. This deviation improves rather than degrades the phase goal.

---

### Gaps Summary

No gaps. All 4 success criteria are achieved with codebase evidence:

1. Style Mapbox sur-mesure injecté via env var, validated on device (MAP-01).
2. Heatmap rose→ambre with 7 correct stops + zoom-based opacity falloff (MAP-02).
3. Markers: `PinIcon` + `PinIconSelected` on `PointAnnotation` + `refresh()` re-snapshot + `useStaggeredVisible` cascade (MAP-03).
4. FAB squircle (`T.fab=18`, `borderCurve:'continuous'`, reanimated spring, haptics) + editorial floating band (NO BlurView, `T.radiusLg`, `borderCurve`) + token pivot D-12 locked in theme.ts and CLAUDE.md (UI-02).

The only identified items are INFO-level: one cast to `any` for a missing MapPoint field, one `as any` for Mapbox style expressions (both standard for this codebase and library), and an un-updated GSD-P2 table row in CLAUDE.md.

---

_Verified: 2026-06-01_
_Verifier: Claude (gsd-verifier)_

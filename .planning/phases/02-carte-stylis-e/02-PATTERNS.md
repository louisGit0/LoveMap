# Phase 2: Carte stylisée - Pattern Map

**Mapped:** 2026-06-01
**Files analyzed:** 11 (8 modified, 1–2 created, 2 docs/config)
**Analogs found:** 11 / 11 (all surfaces have an in-repo analog — no greenfield)

> Phase 2 is a **refactor-in-place** phase. Almost every target file is its own best analog (the existing component IS the thing being reworked). The cross-cutting work (D-12 radius tokens, `borderCurve:'continuous'`, haptics, reanimated FAB) draws from `constants/theme.ts`, `lib/haptics.ts`, and the RESEARCH.md sketches. Planner: prefer editing the existing file over rewrites; copy the structural skeleton, swap the values per UI-SPEC.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `constants/theme.ts` | config (design tokens) | transform (static) | itself (extend `Theme` type + token maps) | exact (self) |
| `constants/config.ts` | config | transform (static) | itself (`COLORS` block) | exact (self) |
| `components/map/HeatmapLayer.tsx` | component (GL layer) | transform (GeoJSON→GL expr) | itself (swap expressions only) | exact (self) |
| `components/map/PointMarker.tsx` | component (native annotation) | event-driven (onSelected/refresh) | itself (`PinIcon` + `PointAnnotation`) | exact (self) |
| `components/map/AppMapView.tsx` | component (map wrapper) | request-response (camera/recenter) | itself (`recenterButton`) | exact (self) |
| `components/map/MapHeader.tsx` → control band | component (overlay) | event-driven (toggle/select) | itself + `PageHeader.tsx` (eyebrow+title) | exact (self) |
| `components/map/FriendSelector.tsx` | component (overlay trigger+modal) | event-driven (select) | itself (`trigger` pill) | exact (self) |
| `app/(app)/map/index.tsx` (FAB + staggered mount) | route/screen | request-response + event | `PressableScale.tsx` (spring) + RESEARCH Pattern 3 | role-match |
| **new** `components/map/SegmentedToggle.tsx` (optional extract) | component (control) | event-driven | `MapHeader.tsx` toggle block | role-match |
| **new** `components/map/ControlBand.tsx` (optional, if MapHeader replaced) | component (overlay) | event-driven | `MapHeader.tsx` | exact (self) |
| `CLAUDE.md` §Identité visuelle | doc | n/a | n/a (revise prose per D-12 table) | doc |

> The two `new` rows are **optional extractions** — the planner may keep everything inside a reworked `MapHeader.tsx`. UI-SPEC §Bandeau treats the band as one cluster; a `SegmentedToggle` extract is justified only if reused. Default: rework `MapHeader.tsx` in place.

---

## Shared Patterns

These apply to **every** rounded surface and every interactive control in this phase. Reference them from each plan rather than re-describing.

### Pattern S1 — Themed component skeleton (ALL components)
**Source:** `components/map/MapHeader.tsx:18-21`, mirrored in every `.tsx` here.
**Apply to:** every component file touched.
```tsx
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
// ... StyleSheet via makeStyles(T) at bottom, typed `(T: Theme) => StyleSheet.create({...})`
```
Never hardcode hex/fontFamily — use `T.xxx` and `F.xxx`. Insets via `useSafeAreaInsets()` (see `MapHeader.tsx:19`), never `SafeAreaView`.

### Pattern S2 — D-12 radius token consumption + `borderCurve` (ALL rounded surfaces)
**Source token authority:** `constants/theme.ts` (extend per below). **Discipline (RESEARCH Unknown #3):** any `borderRadius ≥ radiusSm` MUST add inline `borderCurve:'continuous'`. `borderCurve` is a **per-style prop, not a token** — never put it in the `Theme` type.
```tsx
// in a makeStyles StyleSheet object:
controlBand: { borderRadius: T.radiusLg, borderCurve: 'continuous', /* ... */ },
fab:         { borderRadius: T.fab,      borderCurve: 'continuous', /* ... */ },
```

### Pattern S3 — Haptics, fire-and-forget (ALL controls)
**Source:** `lib/haptics.ts:6-31` (intent API, no `await`, no try/catch).
**Apply to (UI-SPEC §Bandeau table):**
| Control | Call | Site |
|---------|------|------|
| Toggle Points/Heatmap | `haptics.select()` | `MapHeader` onPress of each segment |
| FriendSelector pick | `haptics.select()` | `FriendSelector.handleSelect` |
| Recentrer | `haptics.tap()` | `AppMapView.handleRecenter` |
| FAB | `haptics.press()` | `map/index.tsx` FAB onPress |
| Load error | `haptics.error()` | `map/index.tsx` `if (!ok)` branch (line 42) |
```tsx
import { haptics } from '@/lib/haptics';
onPress={() => { haptics.select(); onViewModeChange('heatmap'); }}
```

### Pattern S4 — SVG custom icons only
**Source:** `components/icons.tsx` — `IcoPlus` (FAB, `:46`), `IcoPin`/`IcoHeat` (toggle, `:9`/`:70`). Signature `{ size?, color? }`. NO `@expo/vector-icons`. A recenter icon, if used instead of the mono "Recentrer" label, must be a new `Ico*` in `components/icons.tsx`.

---

## Pattern Assignments

### `constants/theme.ts` (config, static) — D-12 token pivot

**Analog:** itself. Extend the `Theme` type and both theme objects.

**Current shape** (`theme.ts:1-15`, `:29-30`, `:45-46`):
```tsx
export type Theme = { /* ...colors... */ cardRadius: number; pill: number; };
// darkTheme / lightTheme both: cardRadius: 4, pill: 4
```

**Change (UI-SPEC §D-12 / RESEARCH Unknown #3 — locked values):**
- Extend `Theme` type with: `radiusXs: number; radiusSm: number; radiusMd: number; radiusLg: number; radiusXl: number; fab: number;`
- Add to **both** `darkTheme` and `lightTheme` (same values): `radiusXs:8, radiusSm:12, radiusMd:16, radiusLg:22, radiusXl:28, fab:18`.
- Revise existing in both: `cardRadius: 4 → 16`, `pill: 4 → 999`.
- `T = darkTheme` back-compat export (`:50`) stays.

> Do NOT add `borderCurve` here. Do NOT touch colors. Keep dark/light values identical for radii.

---

### `constants/config.ts` (config, static) — data-viz hex centralization

**Analog:** itself (`COLORS` block `:8-16`).

**Change (UI-SPEC §Color / RESEARCH Unknown #2):**
- `MAPBOX_STYLE` (`:4`) is **already wired** to `EXPO_PUBLIC_MAPBOX_STYLE` with `dark-v11` fallback — MAP-01 is a value/env swap (human checkpoint D-04), **no code change** beyond optionally documenting it.
- Centralize the heatmap/data-viz constants that live outside the dark/light `T` tokens: ember ambre `#ffb020`/`#ffc24d` and map base `#08080a`. Add to `COLORS` (or a new `MAP_COLORS` const).
- `mapBg: '#0d1a2e'` (`:14`) is **rejected by D-03** — do not reference it; the base is `#08080a` (Studio-side). Leave or remove, but stop using `mapBg`.

---

### `components/map/HeatmapLayer.tsx` (component, transform) — MAP-02

**Analog:** itself. Structure stays (`ShapeSource` + `HeatmapLayer`, `style={{...} as any}`, `useMemo` GeoJSON `:10-25`). **Only the expression values change.**

**Current expressions to replace** (`HeatmapLayer.tsx:35-54`):
```tsx
heatmapColor: ['interpolate',['linear'],['heatmap-density'],
  0,'rgba(0,0,0,0)', 0.15,'rgba(156,39,176,0.6)', 0.5,'#e91e8c', 1.0,'#ff5722'],
heatmapRadius: ['interpolate',['linear'],['zoom'], 10,20, 14,40, 18,60],
heatmapOpacity: 0.85,
heatmapWeight: ['interpolate',['linear'],['get','weight'],0,0,1,1],
heatmapIntensity: ['interpolate',['linear'],['zoom'],10,0.8,14,1.5],
```

**Replace with (RESEARCH Unknown #2 / UI-SPEC §Heatmap — locked):**
```tsx
heatmapColor: ['interpolate',['linear'],['heatmap-density'],
  0.0,'rgba(0,0,0,0)',          // transparent — REQUIRED first stop (Pitfall 3: else whole-map tint)
  0.1,'rgba(255,45,135,0.15)',  // rose froid
  0.3,'rgba(255,45,135,0.55)',  // rose signature #ff2d87
  0.5,'#ff5a7a', 0.7,'#ff8a4c', 0.9,'#ffb020', 1.0,'#ffc24d'],
heatmapOpacity: ['interpolate',['linear'],['zoom'], 10,0.85, 13,0.80, 15,0.55, 17,0.35, 19,0.25],
heatmapRadius: ['interpolate',['linear'],['zoom'], 10,22, 14,44, 18,70],
heatmapWeight: ['interpolate',['linear'],['get','weight'],0,0,1,1],   // unchanged
heatmapIntensity: ['interpolate',['linear'],['zoom'], 10,0.8, 14,1.4],
```
Keep the `as any` cast (`:55`) and the GeoJSON `useMemo` (perf). `heatmapOpacity` becomes an **array** (was scalar `0.85`).

---

### `components/map/PointMarker.tsx` (component, event-driven) — MAP-03

**Analog:** itself. Two changes: (1) refine `PinIcon` + add a selected variant, (2) wire `onSelected`/`onDeselected` + `refresh()`.

**Current `PinIcon`** (`PointMarker.tsx:47-69`): head 26×26 r13, dot 10×10, stem 2×9, bottom 4×4. **No selected state, no `ref`.**

**Current annotation** (`:83-90`):
```tsx
<MapboxGL.PointAnnotation id={point.id} coordinate={[point.longitude, point.latitude]}
  anchor={{ x: 0.5, y: 1 }} onSelected={() => setModalVisible(true)}>
  <PinIcon T={T} />
</MapboxGL.PointAnnotation>
```

**Rework (RESEARCH Pattern 1 / Unknown #1 — snapshot constraint; UI-SPEC §Markers):**
- **Refine rest pin (D-05):** head **24×24 r12**, dot **9×9**, stem **2×8**, bottom 4×4, static glow `shadowColor:T.primary, shadowRadius:6, shadowOpacity:0.5, shadowOffset:{0,0}`.
- **Add `PinIconSelected` (D-06):** halo ring 44×44 (`rgba(255,45,135,0.12)` fill, `1px rgba(255,45,135,0.45)` border) behind a **30×30** head.
- **Selected state via re-snapshot, NOT animation:**
```tsx
const annRef = useRef<MapboxGL.PointAnnotation>(null);
const [selected, setSelected] = useState(false);
useEffect(() => { annRef.current?.refresh(); }, [selected]); // Pitfall 2: must call refresh()
// ...
<MapboxGL.PointAnnotation ref={annRef} id={point.id}
  coordinate={[point.longitude, point.latitude]} anchor={{ x: 0.5, y: 1 }} selected={selected}
  onSelected={() => { setSelected(true); setModalVisible(true); }}
  onDeselected={() => setSelected(false)}>
  {selected ? <PinIconSelected T={T} /> : <PinIcon T={T} />}
</MapboxGL.PointAnnotation>
```
> **AVOID:** reanimated/Animated transform on `PinIcon` children — snapshot freezes it (no-op). **AVOID:** reintroducing `MarkerView` (project regression, see comment `:79-82`).

**Preview Modal (`:92-176`) stays as-is this phase** (native sheet migration is Phase 3 / IOS-01). Suppression copy in `map/index.tsx` already matches UI-SPEC ("Effacer cette page" / "Cette action est irréversible").

---

### `components/map/AppMapView.tsx` (component, request-response) — UI-02 recenter restyle

**Analog:** itself. `styleURL={APP_CONFIG.MAPBOX_STYLE}` (`:95`) is **already correct** for MAP-01 — no change.

**Recenter button** (`:114-122`, styles `:129-145`) currently: centered bottom, `borderRadius` implicit 0, `paddingHorizontal:16/Vertical:10`, mono "Recentrer" text, `TouchableOpacity` `activeOpacity`.

**Rework (UI-SPEC §Bouton Recentrer):** detach to **bottom-right above the FAB**, squircle **40×40** (`borderRadius: T.radiusSm, borderCurve:'continuous'`), `T.surface` semi-opaque + `1px T.border`, add `haptics.tap()` in `handleRecenter` (`:80-89`), `accessibilityLabel="Recentrer sur ma position"`. Keep the existing `showRecenter` gate (`:41,69,114`).

---

### `components/map/MapHeader.tsx` → editorial control band (component, event-driven) — UI-02 / D-10

**Analog:** itself (eyebrow+title+toggle skeleton already present) + `components/ui/PageHeader.tsx` pattern for the eyebrow/title block.

**Current** (`MapHeader.tsx`): full-width bar pinned `top:0`, `backgroundColor: T.bg + 'e8'`, `borderBottomWidth`, hard-edge toggle with `toggleBtnActive` (`:142-144`).

**Rework (UI-SPEC §Bandeau — anti-blur, règle 13):**
- **Floating card**, not full-width bar: `top: insets.top + 8`, lateral margins 16, `backgroundColor: rgba(10,10,10,0.92)` (≈ `T.surface` @0.92 — **NO BlurView**, règle 13), `borderRadius: T.radiusLg (22)`, `borderCurve:'continuous'`, `1px T.border`.
- **Title block** (reuse current `:30-46`): eyebrow `lovemap` (F.mono 7, ls 2.5, uppercase, `T.textFaint`) + serif italic title `mes moments · NN` / `carte de {nom}`. Bind via `AppText` variant `title`/`eyebrow` for Dynamic Type (`components/ui/AppText.tsx:25` — `maxFontSizeMultiplier` 1.3/1.2).
- **Segmented toggle** (rework `:48-71`): pill container `radiusSm`, segments `radiusXs`, `borderCurve:'continuous'`; active segment fill `T.primary` + `T.text`, inactive `T.textFaint`. Labels **"Points" / "Heatmap"** (rename current "Map"). Add `haptics.select()` per segment.
- **FriendSelector** sits in the title row right slot (`leftSlot`/`vueSlot` `:43-45,126`) — restyle its trigger pill (below).

> Optional extract `SegmentedToggle.tsx` from this block if reused; otherwise keep inline.

---

### `components/map/FriendSelector.tsx` (component, event-driven) — D-10 restyle

**Analog:** itself. **Modal/sheet body (`:48-100`) unchanged** this phase. Only restyle the **trigger pill** (`:39-46`, styles `:106-128`).

**Rework (UI-SPEC §Composition 2):** trigger → pill `borderRadius: T.radiusXs, borderCurve:'continuous'`, `pillPadX = 12` horizontal padding, `T.surface` semi-opaque + `1px T.border`, label mono. Add `haptics.select()` in `handleSelect` (`:32-35`). Keep `IcoUser` (`:44`). Rename visible label from "Maps" to fit the band (UI-SPEC: friend selector is the right-side pill).

---

### `app/(app)/map/index.tsx` (route/screen) — FAB squircle + haptics + staggered mount — UI-02 / D-11 / D-07

**Analogs:** `components/ui/PressableScale.tsx:21-39` (spring scale skeleton) + RESEARCH §Pattern 3 (reanimated FAB) + §Pattern 2 (staggered mount).

**Current FAB** (`map/index.tsx:96-104`, styles `:144-158`): `TouchableOpacity`, **52×52**, `borderRadius: 0`, `IcoPlus size={22}`, **no haptic, no anim**.

**Rework FAB (UI-SPEC §FAB — locked):**
- **56×56**, `borderRadius: T.fab (18)`, `borderCurve:'continuous'`, fill `T.primary`, `IcoPlus size={24} color={T.text}`.
- Glow: `shadowColor:T.primary, shadowOffset:{0,6}, shadowOpacity:0.35, shadowRadius:16, elevation:8`.
- Position unchanged (`right:20, bottom: insets.bottom + 80`), still hidden under `!viewingFriendId` (`:96`).
- **Micro-anim (D-11):** reanimated `withSpring` on `transform:scale` only — `pressIn → 0.92`, `pressOut → 1.0` (damping 14, stiffness 220). RESEARCH Pattern 3 is the canonical sketch; `PressableScale.tsx` is the in-repo spring analog (legacy `Animated` — prefer reanimated per RESEARCH for this one).
- **Haptic (D-11):** `haptics.press()` in `handleFabPress` (`:51-53`).
- `accessibilityLabel="Inscrire un moment"`.

**Staggered mount (D-07 — RESEARCH Pattern 2):** the marker map at `:68-70` currently renders all pins at once. Gate by a per-index delay hook (`STAGGER_MS=40, CAP_MS=320, MAX_STAGGERED~30`, then mount the rest). Render `points.slice(0, visible).map(...)`. **Never leave the map pinless while preview is open** (UI-SPEC). Toggle stays mutually exclusive (`:68/71`): heatmap mode renders no markers.

> Empty hint (`:107-111`) and Snackbar (`:113-115`) copy already match UI-SPEC; add `haptics.error()` at the load-error branch (`:42`).

---

### `CLAUDE.md` §Identité visuelle (doc) — D-12 revision (explicit Phase 2 task)

**No analog** — prose revision. Apply UI-SPEC §"CLAUDE.md à réviser" table:
| Old convention | New (D-12) |
|---|---|
| « angles francs », `cardRadius=4` | formes iOS arrondies, `cardRadius=16` + `radiusXs..Xl` + `borderCurve:'continuous'` |
| FAB carré (`borderRadius:0`) | FAB squircle 56 / `fab=18` |
| `pill: 4` | `pill: 999` |
| Avatars carrés / Inputs underline | **UNCHANGED this phase** (Phase 5 / Phase 3) — do NOT round |

Also add a phases-table row for Phase 2 and the token-table radius entries.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| *(none)* | — | — | Every code surface is a rework of an existing file; the only "new" candidates (`SegmentedToggle`/`ControlBand`) derive directly from `MapHeader.tsx`. No greenfield role exists in this phase. |

**Reanimated FAB note:** the project's only existing press-scale primitive (`PressableScale.tsx`) uses **legacy `Animated`**, not reanimated. RESEARCH mandates reanimated v4 `withSpring` for the FAB (compositor-friendly, installed Phase 1). Treat RESEARCH §Pattern 3 as the source of truth for the FAB animation; `PressableScale` is a structural reference only.

---

## Metadata

**Analog search scope:** `components/map/*`, `components/ui/*`, `constants/*`, `app/(app)/map/`, `lib/haptics.ts`, `components/icons.tsx`.
**Files scanned:** 13 read in full (8 targets + 5 shared-pattern sources).
**Key cross-cutting patterns identified:**
- All components share `useTheme()` + `useMemo(makeStyles)` + `F.xxx` fonts + `useSafeAreaInsets()`.
- D-12 radius pivot is token-driven (`theme.ts`) + per-style `borderCurve:'continuous'` discipline.
- Haptics via `lib/haptics.ts` intent API, fire-and-forget, mapped per UI-SPEC §Bandeau table.
- Marker selection/appearance is **snapshot-constrained** (re-snapshot via `refresh()` + staggered mount, NOT animation) — the single highest-risk item.
**Pattern extraction date:** 2026-06-01

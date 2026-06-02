# Phase 3: Création & Détail de point (sheets natifs) - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 11 (4 redesign/migrate, 2 cleanup, 1 new, 4+ pure moves)
**Analogs found:** 11 / 11 (every file has an in-repo analog; the two screens are self-analogs)

> Read-only mapping. Phase 3 is a **presentation refactor** (D-07: zero business-logic / DB change). The highest-risk item is the **navigation restructure** (folder move + `Tabs`→`Stack` rewrite). All excerpts below are verified line refs in the current tree.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(app)/_layout.tsx` | route/layout (becomes Stack) | request-response (nav) | `app/_layout.tsx` (root `<Stack>`) + own current `<Tabs>` | exact (Stack analog in-repo) |
| `app/(app)/(tabs)/_layout.tsx` **(NEW)** | route/layout (Tabs) | request-response (nav) | current `app/(app)/_layout.tsx` lines 56-138 (verbatim move) | exact (literal relocation) |
| `app/(app)/(tabs)/map/index.tsx` *(moved + cleanup)* | screen | event-driven (map) | self (same file, new path) | exact (move) + cleanup |
| `app/(app)/(tabs)/point/list.tsx` *(moved)* | screen | CRUD (read) | self | exact (move only) |
| `app/(app)/(tabs)/friends/index.tsx` *(moved)* | screen | CRUD | self | exact (move only) |
| `app/(app)/(tabs)/friends/requests.tsx` *(moved)* | screen | CRUD | self | exact (move only) |
| `app/(app)/(tabs)/profile/index.tsx` *(moved)* | screen | CRUD | self | exact (move only) |
| `app/(app)/point/new.tsx` | screen (→ formSheet) | request-response (form + RPC) | self | exact (self-analog redesign) |
| `app/(app)/point/[id].tsx` | screen (→ formSheet) | request-response (read + update + delete) | self | exact (self-analog redesign) |
| `components/map/PointMarker.tsx` | component (map) | event-driven (tap → nav) | self (remove Modal subtree) | exact (self-analog cleanup) |

> **Path note:** `point/new.tsx` and `point/[id].tsx` **do NOT move** — they stay at `app/(app)/point/*` as siblings of the `(tabs)` group (RESEARCH §Recommended Project Structure). Only the 5 tab screens descend into `(tabs)/`.

---

## NAVIGATION RESTRUCTURE — HIGHEST RISK (map precisely)

### Move map (verified against RESEARCH lines 146-165)

```
app/(app)/
├── _layout.tsx              # REWRITE  <Tabs> → <Stack>  (session guard STAYS, identical)
├── (tabs)/                  # NEW group folder (URL-transparent — no segment in URL)
│   ├── _layout.tsx          # NEW = the CURRENT _layout.tsx body (the <Tabs>), minus the 2 point/* href:null lines
│   ├── map/index.tsx        # MOVED (also cleaned, see PointMarker cleanup)
│   ├── point/list.tsx       # MOVED
│   ├── friends/index.tsx    # MOVED
│   ├── friends/requests.tsx # MOVED (stays href:null in Tabs)
│   └── profile/index.tsx    # MOVED
└── point/
    ├── new.tsx              # STAYS (sibling of (tabs)), presented formSheet
    └── [id].tsx            # STAYS, presented formSheet
```

### Analog for the new Stack: `app/_layout.tsx` line 110

```tsx
// root already uses a bare Stack — the (app) layout mirrors this shape
<Stack screenOptions={{ headerShown: false }} />
```

### Current `(app)/_layout.tsx` value deltas

| What | Current (line) | Phase 3 target |
|------|----------------|----------------|
| Navigator | `<Tabs ...>` (72-81) | `<Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor: T.bg } }}>` (RESEARCH Pattern 1, lines 192) — `contentStyle` mitigates swipe flash |
| Session guard | lines 56-69 (`session/loading`, `router.replace('/(auth)/login')`, `if(!session) return null`) | **keep verbatim** in the new Stack file |
| Tab screens (82-111) | declared here | **move whole `TabIcon` + `<Tabs>` block to `(tabs)/_layout.tsx`** |
| Hidden screens (112-115) | `point/new`, `point/[id]`, `friends/requests` all `href:null` | `point/new` + `point/[id]` become `<Stack.Screen options={sheetOptions}>` in PARENT; `friends/requests` stays `href:null` **inside `(tabs)/_layout.tsx`** |
| `makeStyles` tabBar (120-138) | here | moves with the Tabs block |

### Sheet options block (RESEARCH lines 182-189, UI-SPEC §Native Sheet Config)

```tsx
const sheetOptions = {
  presentation: 'formSheet',
  sheetAllowedDetents: [0.92],   // D-02 détent unique (≥0.7 mitigates #3235)
  sheetGrabberVisible: true,     // D-03
  sheetCornerRadius: 28,         // D-03 = T.radiusXl
  gestureEnabled: true,          // IOS-01 swipe-to-dismiss
  headerShown: false,            // editorial header internal
} as const;

<Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }}>
  <Stack.Screen name="(tabs)" />
  <Stack.Screen name="point/new"  options={sheetOptions} />
  <Stack.Screen name="point/[id]" options={sheetOptions} />
</Stack>
```

### Routing invariants to verify with `tsc` after move (RESEARCH lines 165, A2)
- `router.replace('/(app)/map')` — `point/new.tsx:170`, `point/[id].tsx:109`, `handleDelete` → still resolves (`(tabs)` is transparent, `map` is unique).
- `router.push('/(app)/point/'+id)` — `app/_layout.tsx:88` notif handler + `PointMarker` onSelected → now opens the **sheet** (desired).
- `router.push({ pathname:'/(app)/point/new', params:{...} })` — `map/index.tsx:87,92` (long-press + FAB) → opens creation sheet.
- **Anti-pattern (RESEARCH line 251):** declaring the sheets at root `app/` loses the `(app)` session guard and pushes full-screen. Sheets MUST be siblings of `(tabs)` inside `(app)`.

---

## Pattern Assignments

### `app/(app)/(tabs)/_layout.tsx` (NEW — relocated Tabs)

**Analog:** current `app/(app)/_layout.tsx` (lines 12-138) — **literal move**, two edits only.

- Move `TabIcon` (12-54), `AppLayout` body (56-118 minus session guard which stays in parent OR is duplicated — planner decides; simplest: guard stays in `(app)/_layout.tsx`, tabs file is guard-free since it only renders under an authed parent), and `makeStyles` (120-138).
- **Remove** the two lines (113-114):
  ```tsx
  <Tabs.Screen name="point/new" options={{ href: null }} />
  <Tabs.Screen name="point/[id]" options={{ href: null }} />
  ```
- **Keep** line 115: `<Tabs.Screen name="friends/requests" options={{ href: null }} />`.
- Tab screen `name=` props are unchanged (`map/index`, `point/list`, `friends/index`, `profile/index`) because the files move *with* the layout into `(tabs)/`.

---

### `app/(app)/point/new.tsx` (screen → formSheet, request-response) — REDESIGN

**Analog:** self. Keep ALL business logic (`handleSubmit` 118-171, `createPoint` RPC, GPS validation, date parse). Restyle presentation + add dirty-guard.

**Already in place (keep):** `KeyboardAvoidingView` + `ScrollView` (174-178), date JJ/MM/AAAA segments (244-276 — the date-segment pattern to REUSE in `[id].tsx`), note-segment tap pattern (286-295), partner chips (336-358), CTA (364-377).

**Keyboard pattern (RESEARCH lines 334-351) — value deltas:**
```tsx
<KeyboardAvoidingView
  style={styles.container}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={0}                 // ADD — no native header in sheet
>
  <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}  // ADD — home indicator + clôture
  >
```

**Dirty-guard (RESEARCH Pattern 2, lines 202-228) — NEW, add near top of component:**
```tsx
import { usePreventRemove } from '@react-navigation/native';
const isDirty = comment.trim() !== '' || durationMinutes !== '' || note !== 7 || selectedPartnerId !== null;
usePreventRemove(isDirty, ({ data }) => {
  haptics.warn();
  Alert.alert('Abandonner ce moment ?', 'Votre saisie ne sera pas enregistrée.', [
    { text: "Continuer l'écriture", style: 'cancel' },
    { text: 'Abandonner', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
  ]);
});
```
> `Alert` is already imported in `map/index.tsx:2` / `[id].tsx:11` — copy that import. `navigation` via `useNavigation()`. **Tap-backdrop leak (#3568) is accepted (Option A)** per RESEARCH lines 285-292 — document, do not block.

**Per-file value deltas (UI-SPEC §Page Composition Création):**
| Current (line) | Target |
|----------------|--------|
| `innerBorder` JSX 181 + style 402-408 | **DELETE** (D-08 no skeuomorphism) |
| `header` `paddingTop: insets.top + 24` (180) | **remove `insets.top`** — sheet starts under grabber (RESEARCH anti-pattern line 254) |
| Title "Inscrire un moment" (183) + note lower in flow | **NOTE FIRST** (D-10): note Display `72`/lineHeight `68` is the hero at top; eyebrow `N° 001 — Nouvelle page` |
| `noteValue` fontSize `64` (531) | `72` (UI-SPEC Création Display) |
| `partnerName` `fontFamily: F.sans` (642) | **serif** — `F.sans*` banned on this page (UI-SPEC §Typography) |
| `cancelText` "Annuler" (380) | "Abandonner la saisie" (mono eyebrow `T.textFaint`, UI-SPEC copy) |
| `miniMap` borderWidth/no radius (455-462) | `T.radiusMd` (16) + `borderCurve:'continuous'` |
| `partnerChip` no radius (604-613) | `T.radiusSm` (12) + `borderCurve:'continuous'`; chip pad uses `pillPadX=12` |
| `segment` (547-554) | `T.radiusXs` (8) |
| CTA block (648-689) | `T.radiusMd` (16) + `borderCurve:'continuous'` |

---

### `app/(app)/point/[id].tsx` (screen → formSheet, request-response) — REDESIGN

**Analog:** self. Keep `loadPoint` (80-98), `handleConsent` (140-150), `handleDelete` (100-114), `handleSaveAndAccept` (125-138), `enterEditMode` (116-123).

**Remove floating back button (UI-SPEC §Navigation, D-06):**
- JSX 201-204 (`backBtn` `TouchableOpacity` + `IcoArrow dir="left"`) → DELETE.
- Style `backBtn` 393-403 (incl. `T.bg + 'cc'`) → DELETE.
- Drop `IcoArrow`-left usage; `IcoArrow` still used by CTA arrow `dir="right"` (353) — keep import.

**Swap DatePickerModal → JJ/MM/AAAA segments (RESEARCH Pitfall 2, lines 294-301):**
- Current edit date uses `DatePickerModal` (318-328) + `showDatePicker` state (72) + `editDateBtn` (313-317). The `DatePickerModal` (an RN `Modal`) **freezes iOS when `usePreventRemove` is active (#2125)**.
- **Copy the 3-segment date pattern from `point/new.tsx:244-276`** (`dateRow`/`dateSegment`/`dateSep` + `dayStr/monthStr/yearStr` state) into the edit block. Removes the Modal AND the `react-native-paper-dates` dep on this screen (UI-SPEC discipline bonus).
- Remove import `DatePickerModal` (15).

**Wrap edit form in KeyboardAvoidingView (RESEARCH line 351):** the edit block has bare `TextInput`s (303-340) with NO KAV today. Add `KeyboardAvoidingView` (same pattern as `new.tsx`) for edit-mode text inputs.

**Edit-mode dirty-guard (conditional, RESEARCH Pitfall 2):**
```tsx
const isEditDirty = editing && ( editNote !== point.note || editComment !== (point.comment ?? '') || ... );
usePreventRemove(isEditDirty, ({ data }) => { /* same Alert as new.tsx */ });
```
> If `DatePickerModal` were kept, guard MUST be gated `&& !showDatePicker`. Swapping to segments removes this hazard entirely — **preferred**.

**Typography harmonisation (UI-SPEC §Action Placement, removes `F.sans*`):**
| Current (line) | Target |
|----------------|--------|
| `consentEditText` `F.sansMedium` (549) | **mono uppercase** (Eyebrow) |
| `consentAcceptText` `F.sansMedium` (561) | **serif italic** (Heading) |
| `saveBtnLabel` `F.sansMedium` (673) | **serif italic** (Heading) |
| centered states `paddingTop: insets.top` (154,162) | **remove `insets.top`** (in sheet) |
| `quoteMark` `F.serifMedium` (443) | `F.serif` 400 — `F.serifMedium` banned (UI-SPEC) |
| Empty copy "Page introuvable." (163) | "Page introuvable. Faites glisser vers le bas pour fermer." |

**Internal radii (UI-SPEC Détail table):** miniMap `T.radiusMd`+continuous; photoThumb (460-465) `T.radiusSm`+continuous; consentBadge (502-507) `T.radiusXs`; consent/save buttons `T.radiusMd`+continuous. `markerDot` (385-392) stays round.

**Destructive trigger color:** `deleteBtnText` currently `T.primary` (712) → **`T.danger`** (UI-SPEC: rose reserved for affirmative actions). `IcoTrash` color (366) likewise `T.danger`.

---

### `components/map/PointMarker.tsx` (component, event-driven) — CLEANUP

**Analog:** self (after removing Modal). Keep `PinIcon`/`PinIconSelected` (48-115), `annRef.refresh()` effect (126-128), `PointAnnotation` (138-148).

**Target (RESEARCH Pattern 3, lines 232-248):**
```tsx
onSelected={() => { setSelected(true); router.push(`/(app)/point/${point.id}`); }}
onDeselected={() => setSelected(false)}
```

**Delete (RESEARCH Runtime Inventory line 278):**
| Item | Lines |
|------|-------|
| Entire `<Modal>` subtree | 150-234 |
| Modal styles (`overlay`, `sheet`, `handle`, `noteRow`...`deleteBtn`) | 240-369 |
| `modalVisible` / `setModalVisible` state | 120 |
| `Props.isOwner` / `Props.onDelete` (now unused) | 18-22, signature 117 |
| Unused imports: `Modal`, `TouchableOpacity`, `TouchableWithoutFeedback`, `Text`, `IcoTrash`, `formatDuration`/`formatDateRelative` helpers (24-41) | 4-14 |

> After cleanup the component is just `PinIcon`s + `PointAnnotation`. Pin re-selection quirk (RESEARCH Pitfall 3): rely on `onDeselected` reset; validate on device.

---

### `app/(app)/(tabs)/map/index.tsx` (screen, event-driven) — CLEANUP (+ moved)

**Analog:** self. Moves into `(tabs)/` AND loses dead delete plumbing.

| Item | Lines | Action |
|------|-------|--------|
| `handleDelete` | 95-103 | **DELETE** — delete now lives only in the detail sheet (RESEARCH line 280) |
| `<PointMarker ... isOwner=... onDelete={handleDelete} />` | 109 | → `<PointMarker key={p.id} point={p} />` (props removed) |
| `deletePoint` destructure | 55 | **remove** if `handleDelete` was its only consumer (verify with `tsc`) |
| `Alert` import | 2 | remove if `handleDelete` was its only use |

> Keep `handleFabPress`/`handleLongPress` (86-93) and `haptics.press()` (91) — unchanged entry points to the creation sheet. FAB squircle uses `T.fab`/`borderCurve` (192-205) — reference pattern for internal radii.

---

## Shared Patterns

### Theme + makeStyles (apply to ALL touched screens/components)
**Source:** every file, e.g. `point/new.tsx:34-35`
```tsx
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
// makeStyles = (T: Theme) => StyleSheet.create({ ... })  ; no hardcoded hex / fontFamily
```

### Haptics intent API
**Source:** `lib/haptics.ts:6-31` — `select / tap / press / success / warn / error`. Fire-and-forget, never `await`.
**Apply to:** segment/chip tap `haptics.select()`; seal `haptics.success()`; refuse/dismiss/delete `haptics.warn()`; errors `haptics.error()`.

### Radius tokens (D-12) for internal sheet elements
**Source:** `constants/theme.ts:38-43` — `radiusXs:8, radiusSm:12, radiusMd:16, radiusLg:22, radiusXl:28, fab:18` (identical dark/light). Pair with `borderCurve:'continuous'`. `sheetCornerRadius:28` = `radiusXl`.

### Native confirm Alert (destructive)
**Source:** `[id].tsx:102-113` / `map/index.tsx:96-102`
```tsx
Alert.alert('Effacer cette page', 'Cette action est irréversible.', [
  { text: 'Garder la page', style: 'cancel' },
  { text: 'Effacer', style: 'destructive', onPress: async () => { ... } },
]);
```
**Apply to:** delete confirm (keep) AND the new D-04 dismiss confirm (same shape, different copy).

### Safe-area
**Source:** `useSafeAreaInsets()` (`new.tsx:29`, `[id].tsx:54`). Keep `insets.bottom` for home indicator; **drop `insets.top`** inside sheets (RESEARCH line 254).

### Custom SVG icons
**Source:** `components/icons.tsx` — `IcoArrow(dir)`, `IcoSearch`, `IcoClose`, `IcoTrash`, `IcoPlus`. No `@expo/vector-icons`.

### Snackbar (errors)
**Source:** `new.tsx:385-387`, `[id].tsx:373-375` — `<Snackbar style={styles.snackbar}>` over `T.surface2`.

### PressableScale / AppText (available, optional)
**Source:** `components/ui/PressableScale.tsx` (spring scale, `scaleValue` default 0.95) and `components/ui/AppText.tsx` (variants `body/title/eyebrow`, bounded Dynamic Type). Reuse for CTA press feedback / bounded text per UI-SPEC §Motion.

---

## No Analog Found

None. Every Phase 3 file has an in-repo analog (the two screens are self-analogs; `app/_layout.tsx` is the Stack analog; the date-segment block in `new.tsx` is the analog for the `[id].tsx` date swap). No new dependency, no greenfield pattern (D-01).

> A small shared component for the carnet note-input / date-segments is **extractable but optional**: the note-segment bar and JJ/MM/AAAA segments already exist inline in `new.tsx` and (post-swap) `[id].tsx`. D-09 mandates distinct creation/detail treatments, so extraction is low-value — planner may inline-duplicate or extract a thin presentational helper; not required.

## Metadata

**Analog search scope:** `app/(app)/`, `app/_layout.tsx`, `components/map/`, `components/ui/`, `components/icons.tsx`, `constants/`, `lib/`
**Files scanned (read in full):** `app/(app)/_layout.tsx`, `app/_layout.tsx`, `components/map/PointMarker.tsx`, `app/(app)/point/new.tsx`, `app/(app)/point/[id].tsx`, `app/(app)/map/index.tsx`, `constants/theme.ts`, `lib/haptics.ts`, `components/ui/AppText.tsx`, `components/ui/PressableScale.tsx`; grep `components/icons.tsx`
**Pattern extraction date:** 2026-06-02

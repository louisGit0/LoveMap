# Phase 4: Listes & Cercle - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 8 (3 screens, 3 row components, 1 hook, 1 store) + 1 deletion + 1 new hook method
**Analogs found:** 9 / 9 (every new/modified file has an in-repo analog — this is a restyle of working screens; zero new dependencies)

> **Nature of this phase:** presentation re-skin of 3 existing screens + 1 thin hook method (`respondToTag`) + 1 file deletion (`FiltersBottomSheet`). The data/behavior layer already exists. Every analog below is a **real file already in the repo** — most files are their own analog (in-place restyle). All line references verified by Read this session.

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `app/(app)/(tabs)/point/list.tsx` | route/screen | read + transform (filter→group→sort) | itself (in-place) + `friends/requests.tsx` (SectionList/section headers) | exact (self-restyle) |
| `app/(app)/(tabs)/friends/index.tsx` | route/screen | CRUD (read friends + delete unfriend) + search | itself (in-place); `unfriend` already wired | exact (self-restyle) |
| `app/(app)/(tabs)/friends/requests.tsx` | route/screen | CRUD (read pending + update status) | itself (in-place); `handleRespond` ⇒ new `handleRespondTag` | exact (self-restyle) |
| `components/point/PointListItem.tsx` | component (presentational row) | request-response (tap→nav) | itself; `requests.tsx` `tagItem` (note-box twin) | exact (self-restyle) |
| `components/friends/FriendItem.tsx` | component (row + destructive) | event-driven (Alert→hook) | itself; `FriendRequestItem` (sibling layout) | exact (self-restyle) |
| `components/friends/FriendRequestItem.tsx` | component (row + actions) | event-driven (accept/reject) | itself; `components/ui/Button` for new text buttons | exact (self-restyle) |
| `hooks/useFriends.ts` — **add** `respondToTag()` | hook (data access) | CRUD update (mono-table) | `point/[id].tsx` `handleConsent` (155-158) + `respondToRequest` (47-61) | exact (extract-to-hook) |
| `stores/friendStore.ts` | store (zustand) | state | itself (`removeFriend` 24-27) | exact (self) |
| `components/point/FiltersBottomSheet.tsx` | component | **DELETE** (D-10) | n/a — referenced only by `list.tsx` (verified) | safe delete |

**Shared establishment patterns (apply to every file):** theme `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` · `useSafeAreaInsets()` (never `SafeAreaView`) · `haptics.*` fire-and-forget (never `await`) · no Supabase in components (rule 4) · all UI copy in French.

---

## Pattern Assignments

### `app/(app)/(tabs)/point/list.tsx` (screen, read + transform) — UI-05

**Analog:** itself (restyle). The screen already implements the exact mechanics D-02/D-04 need.

**Theme + screen scaffold pattern** (lines 64-69):
```typescript
export default function PointList() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
```

**KEEP verbatim — `groupByMonth()` (D-02)** (lines 34-62): handles FR month labels, multi-sort, year keying, descending section order. The planner reuses this unchanged; only the `sort` value feeding it changes (`'note'→'note_desc'`, `'date'→'date_desc'`).

**REPLACE — filter state coupled to FiltersBottomSheet** (lines 74-77, 99-121) with a 2-field inline state. Current:
```typescript
const [filtersOpen, setFiltersOpen] = useState(false);
const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);
const activeCount = countActiveFilters(filters);
// ... lines 99-121: filtered = points.filter on minNote + partnerStatus + period
const sections = useMemo(() => groupByMonth(filtered, filters.sort), [filtered, filters.sort]);
```
D-03 only needs `minNote` (0/5/7/9) + `sort` (date/note) — drop `partnerStatus`/`period`. Per RESEARCH §Pattern 1:
```typescript
type MinNote = 0 | 5 | 7 | 9;
type Sort = 'date' | 'note';
const [minNote, setMinNote] = useState<MinNote>(0);
const [sort, setSort] = useState<Sort>('date');
const sections = useMemo(() => {
  const filtered = points.filter((p) => p.note >= minNote);
  return groupByMonth(filtered, sort === 'note' ? 'note_desc' : 'date_desc');
}, [points, minNote, sort]);
```

**REMOVE — imports** (lines 17-24): the whole `FiltersBottomSheet`/`DEFAULT_FILTERS`/`countActiveFilters`/`FiltersState`/`FilterSort` import block and `IcoFilter`. `FilterSort` type is now local (or inline literals into `groupByMonth`).

**REMOVE — stats row + filter-button + sheet** (lines 152-171 stats block, 173-190 filter `TouchableOpacity`, 215-220 `<FiltersBottomSheet>`). RESEARCH Pitfall 5: stats row is not in UI-SPEC — drop it. Title copy « Vos moments » → « Le carnet » (line 150).

**CHANGE — sticky month headers (D-02)** (line 204): `stickySectionHeadersEnabled={false}` → remove/`true`. Keep filter pills in `ListHeaderComponent` so they scroll away (only month headers stick).

**REUSE — section header style** (lines 141-146 render, 331-352 styles): eyebrow mono « JUIN 2026 » + filet — already the correct archetype. Title/eyebrow styles (237-253) are reusable.

**KEEP (D-04)** — `SkeletonRow` loading (123-129), `RefreshControl` (205-212), error `Snackbar` (222-224).

**NO ANALOG — inline filter pill bar.** No pill component exists. Use the RESEARCH §Code Examples `FilterPill` snippet (`T.pill` + `borderCurve:'continuous'`, active=`T.primary`, `haptics.select()` on tap) inside `ListHeaderComponent`.

---

### `app/(app)/(tabs)/friends/index.tsx` (screen, CRUD + search) — UI-06

**Analog:** itself. **`unfriend` is already wired** — D-06 is a restyle + copy + haptics task, NOT a data task.

**KEEP — destructive wiring already present** (lines 91-94 + render 191-200):
```typescript
async function handleUnfriend(friendshipId: string) {
  const ok = await unfriend(friendshipId);
  if (!ok) setSnackbar('Erreur lors de la suppression.');
}
// render: <FriendItem friend={item} onUnfriend={() => handleUnfriend(item.id)} onViewMap={...} />
```
Add editorial snackbars (« Retiré du cercle. » success / « Échec — réessayez. » + `haptics.error()` on failure) here per UI-SPEC §Destructive.

**KEEP — debounced `search_users` RPC** (lines 68-77): the 300ms debounce + RPC is correct (RESEARCH Pitfall 6); preserve logic, only swap presentation.

**REPLACE — raw `TextInput` search** (lines 112-123) with `components/ui/Input` (underline, placeholder « Rechercher dans le cercle »). Current raw row uses `IcoSearch` + bare `TextInput`.

**REUSE — title** « le cercle » (102-106) → « Le cercle » (Title 36 serifLight). The `cercleSectionRow` eyebrow (184-187, 407-429) is reusable archetype.

> **⚠ Existing rule-4 deviation to note (do not copy):** `loadFriends` (lines 49-56) runs a direct `supabase.from('friendships')...` pending query inside the screen. Out of scope to fix this phase, but do not extend it.

---

### `app/(app)/(tabs)/friends/requests.tsx` (screen, CRUD update) — UI-07

**Analog:** itself. This is the **only behavioral expansion** (inline taguage consent, D-08).

**ANALOG for the new `handleRespondTag` — `handleRespond`** (lines 116-129): exact shape to copy for the taguage inline action (hook call + haptics + snackbar + reload):
```typescript
async function handleRespond(friendshipId: string, accept: boolean) {
  const ok = await respondToRequest(friendshipId, accept ? 'accepted' : 'rejected');
  if (ok) {
    if (accept) { haptics.success(); } else { haptics.tap(); }
    setSnackbar(accept ? 'Demande acceptée.' : 'Demande refusée.');
    await loadRequests();
  } else { setSnackbar('Erreur lors de la réponse.'); }
}
```
New twin: `handleRespondTag(pointPartnerId, accept)` → calls `respondToTag` (new hook method below), `haptics.success()`/`haptics.warn()`, snackbar « Page scellée. »/« Taguage refusé. », `await loadRequests()`.

**RESTRUCTURE — taguage section from navigation to inline buttons (D-07/D-08)** (lines 160-198): current `tagItem` renders a note-box (336-343, rose 36 note) + « Répondre → » nav `TouchableOpacity` (191-195) that pushes to `point/[id]`. Replace the « Répondre → » CTA with two `Button`s (Sceller `coral`/`solid` + Décliner `ghost`); remove the `router.push` navigation. Per D-07 the taguage line should adopt the avatar+name archetype like the received-requests rows.

**SECTIONS — reduce 3→keep-with-emphasis (D-09):** current 3 sections — Taguages (160-198), Reçues (200-219), Envoyées (221-252). D-07 = two eyebrow-mono primary sections (« DEMANDES REÇUES » + « TAGUAGES EN ATTENTE »); D-09 keeps « Envoyées » as a discreet 3rd block. Section header style (161-164, 291-313) is the reusable eyebrow pattern.

**REPLACE icon→text buttons** in received section: `FriendRequestItem` actions become `Button` (see its entry).

**EMPTY states** (D-07): single empty section → hide its header; both empty → « Pas de page en attente. »

> **⚠ Anti-pattern — DO NOT copy `handleCancel`** (lines 131-139): direct `supabase.from('friendships').delete()` in the screen (rule-4 violation). If « Envoyées » keeps its « Annuler », route it through a `useFriends.cancelRequest()` hook (RESEARCH Q2).

---

### `components/point/PointListItem.tsx` (component, row) — UI-05

**Analog:** itself + `requests.tsx` `tagItem`/`tagNote` (the note-box twin, requests.tsx 336-343).

**KEEP — tap pattern** (lines 26-31): `PressableScale` + `haptics.tap()` + `router.push`.

**REMOVE — `N°00X` index** (line 34 + style 70-77): D-01 drops the sequential number; the `index` prop becomes unused.

**CHANGE — note from rose 36 → `T.text` Display 44 (D-01 + Color override)** (line 37 + style 78-86). Current:
```typescript
note: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 36, lineHeight: 36, color: T.primary, minWidth: 28, textAlign: 'center' },
```
UI-SPEC §Color: note becomes **`T.text`** (anchored by scale, not color), 44px, with a `/10` denom in mono `T.textFaint`. Anchor width ~64. *(Deliberate departure from rose — executor + checker must respect.)*

**CHANGE — chevron** (line 55 + style 112-116): `arrow` `F.sansLight` → `F.mono` `T.textFaint`.

**KEEP — comment serif + meta mono** (41-52, 90-111): already correct archetype (serif italic body + mono meta). Note `comment` fontSize 17 → Heading 20 per §Typography.

**NORMALIZE spacing** (container 64-69): `gap: 14` → `12 (rowGap)`, `paddingVertical: 16` stays (`lg`).

---

### `components/friends/FriendItem.tsx` (component, row + destructive) — UI-06

**Analog:** itself + `FriendRequestItem` (identical avatar/info layout).

**KEEP+UPDATE — destructive `Alert`** (lines 21-30): already the correct platform-native confirm delegating to `onUnfriend`. Update copy to editorial + add `haptics.warn()` at open per UI-SPEC §Destructive:
```typescript
function handleUnfriend() {
  haptics.warn(); // ADD
  Alert.alert(
    'Retirer du cercle ?',                                    // was: 'Retirer du cercle'
    `${profile.display_name ?? profile.username} ne verra plus vos moments partagés. Cette action est irréversible.`,
    [
      { text: 'Garder', style: 'cancel' },                    // was: 'Annuler'
      { text: 'Retirer', style: 'destructive', onPress: onUnfriend },
    ]
  );
}
```

**KEEP — square rose avatar** (lines 34-36 + style 62-76): `borderRadius:0`, `T.surface2`, initial serif italic `T.primary` — D-05 lock, unchanged.

**CHANGE — name `F.sans` 14 → serif Heading 20** (line 38 + style 78-82): `displayName: { fontFamily: F.sans, fontSize: 14 }` → `F.serif` italic 20.

**CHANGE — « Carte » → underline `T.primary`** (41-45, 90-102) and **« Retirer » → mono `T.danger`** (46-48, 103-115): current `removeBtnText` is `T.textFaint`; D-06 makes it `T.danger`. Consider `components/ui/Button variant="underline"` for « Carte ».

---

### `components/friends/FriendRequestItem.tsx` (component, row + actions) — UI-07

**Analog:** itself for layout; `components/ui/Button` for the new text actions.

**KEEP — null guard + avatar** (line 22 `if (!profile) return null;`; avatar 28-30, 56-70 square rose — same as FriendItem).

**REPLACE — icon buttons → text buttons (D-07)** (lines 35-42 render, 84-102 styles): current `acceptBtn` (rose square + `IcoCheck`) / `rejectBtn` (bordered + `IcoClose`) become `Button variant="solid"/"coral"` (Accepter/Sceller) + `Button variant="ghost"` (Refuser/Décliner). Remove `IcoCheck`/`IcoClose` import (line 5).

**CHANGE — name `F.sans` 14 → serif Heading 20** (line 32 + style 72-76), same as FriendItem.

**ADD — props to map amitié vs taguage labels** (D-08): component currently hardwires friendship semantics; parametrize the affirmative/negative labels so one component serves « Accepter/Refuser » and « Sceller/Décliner ».

---

### `hooks/useFriends.ts` — add `respondToTag(pointPartnerId, accept)` (hook, mono-table update) — D-08

**Primary analog — `point/[id].tsx` `handleConsent`** (lines 153-163, the consent logic to extract into a hook):
```typescript
async function handleConsent(accept: boolean) {
  if (!partnerRecord) return;
  const { error } = await supabase.from('point_partners').update({
    status: accept ? 'accepted' : 'rejected',
    responded_at: new Date().toISOString(),
  }).eq('id', partnerRecord.id);
  if (error) { haptics.error(); setSnackbar('Erreur lors de la réponse.'); return; }
  // ... haptics + reload
}
```
> `is_visible` flips **server-side** via the `on_partner_consent` trigger — never set it client-side (CLAUDE.md DB rule). Mono-table update on `point_partners` ⇒ RLS-safe (mig 010/011), no cross-table recursion (rule 18 OK).

**Shape analog — `respondToRequest` / `unfriend`** (lines 47-61, 63-76): the canonical hook-method shape in this file — `useCallback`, `Promise<boolean>` return, `console.error('[useFriends] ...', error.message)` on failure, `return true` on success:
```typescript
const respondToTag = useCallback(async (pointPartnerId: string, accept: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('point_partners')
    .update({ status: accept ? 'accepted' : 'rejected', responded_at: new Date().toISOString() })
    .eq('id', pointPartnerId);
  if (error) { console.error('[useFriends] respondToTag error:', error.message); return false; }
  return true;
}, []);
```
Add `respondToTag` to the returned object (current return block lines 78-88). *(Alternative placement: `usePoints` — but `requests.tsx` already imports `useFriends`, so co-locating there is the lower-friction choice. Planner decides.)*

---

### `stores/friendStore.ts` (store, state)

**Analog:** itself. `removeFriend` optimistic removal (lines 24-27) is already called inside `unfriend` — D-06 needs no store change. `respondToTag` touches `point_partners` (not in this store); `requests.tsx` already reloads via `loadRequests()`, so no store mutation is required. Only touch this file if a `pendingTags` optimistic update is wanted (Claude's discretion per CONTEXT D-08).

---

### `components/point/FiltersBottomSheet.tsx` — DELETE (D-10)

**Verified safe:** Grep confirms `FiltersBottomSheet` + `DEFAULT_FILTERS` + `countActiveFilters` + `FiltersState` + `FilterSort` are referenced **only** by `list.tsx` and the file itself. After the `list.tsx` import removal (above), delete this file. The exported `FilterSort` type used by `groupByMonth`'s signature must be inlined/localized in `list.tsx` first (it currently imports the type from here).

---

## Shared Patterns

### Theme (every component/screen)
**Source:** `hooks/useTheme` + `makeStyles(T)` pattern, present in all 8 files (e.g. `list.tsx` 68-69, `PointListItem.tsx` 17-18).
```typescript
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
// const makeStyles = (T: Theme) => StyleSheet.create({ ... })
```
**Apply to:** all touched components. No hardcoded hex / `fontFamily` (use `T.*` / `F.*`). Test dark **and** light.

### Haptics (fire-and-forget)
**Source:** `lib/haptics.ts` (6-31) — `select/tap/press/success/warn/error`.
**Apply to:** pill tap (`select`), row tap (`tap`, already in `PointListItem` 29), accept/seal (`success`), reject/decline (`warn`), unfriend open (`warn`)/failure (`error`). Never `await`.

### Buttons
**Source:** `components/ui/Button.tsx` — variants `solid`/`coral`/`ghost`/`danger`/`underline` (line 14; underline 38-49).
**Apply to:** requests actions (`solid`/`coral` affirmative, `ghost` negative), « Carte » (`underline`).
> Caveat: `Button` base uses `borderRadius: 0` (line 92) and `F.sansMedium` text (110). For D-12 radii (`T.radiusSm` + `borderCurve:'continuous'`) on filled/bordered request buttons, pass `style` override or restyle locally — `F.sans*` is proscribed on these screens (§Typography), so the request-button labels may need a local serif/mono text rather than `Button`'s default.

### Underline search input
**Source:** `components/ui/Input.tsx` (underline row 57-73, F.serif italic 20).
**Apply to:** `friends/index.tsx` search (replaces raw `TextInput`).

### Eyebrow / section header / square avatar archetype
**Source:** reusable across the 3 screens — `list.tsx` `sectionHeader` (331-352), `requests.tsx` `sectionHeader`/`sectionEyebrow` (291-313), square rose avatar (`FriendItem` 62-76, `FriendRequestItem` 56-70, `requests.tsx` 405-419).
**Apply to:** month headers (D-02), the two request eyebrows (D-07), all avatars (D-05).

### ⚠ AppText 300-weight caveat
**Source:** `components/ui/AppText.tsx` (12-16): `VARIANT_FONT.title = F.serif` **(400, not 300)**.
**Apply to:** Display (44) and Title (36) need **`F.serifLight` (300)** — set `fontFamily: F.serifLight` directly in `makeStyles` (current pattern — all three screens already do, e.g. `list.tsx` title 246), or pass `style={{ fontFamily: F.serifLight }}` to `AppText`. Do NOT rely on `variant="title"` alone for 300-weight text.

### ⚠ No Supabase in components (rule 4) — existing deviations
**Do NOT copy / do NOT extend:**
- `requests.tsx` `handleCancel` (131-139) — direct `friendships.delete()`.
- `friends/index.tsx` `loadFriends` (49-56) — direct `friendships.select()` for `pendingReceived`.
New writes (`respondToTag`) must go through a hook.

---

## No Analog Found

| Need | Role | Reason | Planner guidance |
|------|------|--------|------------------|
| Inline filter pill bar | component/inline | No pill component exists in repo | Use RESEARCH §Code Examples `FilterPill` (`T.pill` + `borderCurve:'continuous'`, active=`T.primary`, `haptics.select()`); reuse `list.tsx` filterBar styles (281-329) as a starting point for the row container |

> Everything else maps to a concrete in-repo analog. No external/library patterns needed — zero new dependencies (UI-SPEC §Design System).

## Metadata

**Analog search scope:** `app/(app)/(tabs)/{point,friends}/`, `app/(app)/point/[id].tsx`, `components/{point,friends,ui}/`, `hooks/`, `stores/`, `lib/haptics.ts`.
**Files scanned (Read):** 14 (3 screens, 4 components, 3 hooks/store, `point/[id].tsx`, 3 ui primitives, haptics). **Grep verifications:** 2 (`FiltersBottomSheet` references; `point_partners` consent location).
**Validation gate (from RESEARCH):** `npm run typecheck` 0 new errors over ~39 baseline; manual TestFlight per-screen, dark + light. No automated test framework exists.
**Pattern extraction date:** 2026-06-02

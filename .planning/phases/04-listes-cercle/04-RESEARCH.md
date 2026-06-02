# Phase 4: Listes & Cercle - Research

**Researched:** 2026-06-02
**Domain:** React Native (Expo SDK 54) UI redesign — list/social screens, "table des matières" archetype
**Confidence:** HIGH (grounded entirely in the actual codebase; zero new dependencies; all claims verified against source files)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (UI-05):** Le gros chiffre serif à gauche de chaque ligne = la **note /10** (pas un N°00X, pas la date). « /10 » discret en mono.
- **D-02 (UI-05):** Liste **groupée par mois** — header eyebrow mono (« JUIN 2026 »), moments triés par date décroissante dans chaque section.
- **D-03 (UI-05):** **Filtres inline** en haut de liste (pills : note min 0/5/7/9+, tri date/note) — **suppression de l'usage de `FiltersBottomSheet`**. Zéro sheet.
- **D-04 (UI-05):** Conserver pull-to-refresh, skeleton (`SkeletonRow`), snackbar erreur réseau.
- **D-05 (UI-06):** Ami = entrée d'annuaire — avatar **carré** (initiale serif italic rose), nom serif, `@username` mono à droite, action « **Carte** » underline. Titre « Le cercle » grand serif. Recherche **underline**.
- **D-06 (UI-06):** Ajouter l'action « **retirer du cercle** » (opt-in). **Confirmation obligatoire** éditoriale, libellé destructif `T.danger`. Via hook `useFriends` (pas d'appel Supabase en composant). Respect RLS friendships.
- **D-07 (UI-07):** **Deux sections** eyebrow mono : « DEMANDES REÇUES » (amitié) et « TAGUAGES EN ATTENTE » (consentement partenaire). Actions Accepter/Refuser (solid/ghost), ton « sceller / décliner ». Empty « Pas de page en attente ».

### Claude's Discretion
- Tailles/espacements exacts (taille du chiffre de note, hauteur de ligne, gaps) → UI-SPEC (résolu).
- Implémentation du retrait d'ami (signature `useFriends`, opération Supabase, maj `friendStore`) → researcher/planner. Respecter RLS + règle 18.
- Style de la barre de filtres inline (pills vs segments) → UI-SPEC : **pills** (résolu).

### Deferred Ideas (OUT OF SCOPE)
- Bloquer / signaler un ami, compteurs sociaux, vue profil d'un ami → backlog.
- *Le retrait d'ami (D-06) n'est PAS différé — explicitement dans le périmètre Phase 4.*
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UI-05 | `point/list` refondu archétype « table des matières » | `groupByMonth()` + `SectionList` déjà présents (réutilisables) ; remplacer l'état couplé à `FiltersBottomSheet` par un état inline `{minNote, sort}` + pills ; activer headers sticky ; refonte `PointListItem` (note Display 44 ancre, suppression N°00X). §Architecture Patterns, §Code Examples. |
| UI-06 | `friends/index` refondu archétype « table des matières » + retrait d'ami (D-06) | `useFriends().unfriend()` + `friendStore.removeFriend()` **déjà implémentés et câblés** ; `FriendItem` a déjà une `Alert` de confirmation (copie générique à remplacer). Travail = restyle + copie éditoriale + `haptics.warn/error` + snackbars succès/échec. §Don't Hand-Roll, §Code Examples. |
| UI-07 | `friends/requests` refondu archétype « table des matières », 2 sections | Écran a aujourd'hui **3 sections** (Reçues/Envoyées/Taguages) ; D-07 en demande **2**. Taguages affichés en navigation « Répondre → » ; D-07 veut des **boutons inline Sceller/Décliner** → nécessite un **hook de consentement partenaire** (aujourd'hui fait en direct dans `point/[id].tsx`). §Open Questions Q1/Q2. |
</phase_requirements>

## Summary

This is a **presentation-layer redesign** of three existing, working React Native screens. No new product capability except an explicit opt-in already 90% present in code: removing a friend (`unfriend`). The entire phase is achievable in **pure JS/TS with zero new dependencies** — confirmed by the UI-SPEC ("zéro nouvelle dépendance") and by the fact that every needed primitive (`Button`, `Input`, `SkeletonRow`, `PressableScale`, `AppText`, custom SVG icons, `haptics`, theme tokens) already exists.

The single most important grounding finding: **`useFriends().unfriend(friendshipId)` and `friendStore.removeFriend()` already exist, are exported, and are already wired** into `friends/index.tsx` (`handleUnfriend`). `FriendItem` already renders a confirmation `Alert`. So D-06 is mostly a **restyle + editorial-copy + haptics** task, not a data-layer task. The UI-SPEC's claim that the hook "déjà implémenté" is **VERIFIED**.

The one genuine **behavioral expansion** is in `requests.tsx`: the UI-SPEC (D-07) wants inline **Sceller / Décliner** buttons on the "TAGUAGES EN ATTENTE" section, but the current screen routes taguages to the point-detail screen ("Répondre →") where consent actually happens via a **direct `supabase.from('point_partners').update(...)` inline in `point/[id].tsx`** (no hook). Adding inline consent in `requests.tsx` therefore requires a thin hook method (rule 4: no Supabase in components). This is the main planning decision — see Open Questions Q1.

**Primary recommendation:** Treat this as 3 restyle plans (one per screen) plus one small hook-extraction task for partner-tag consent. Reuse `groupByMonth()` as-is, replace the `FiltersBottomSheet` filter state with an inline `{minNote, sort}` pill bar, enable sticky `SectionList` month headers, and route the already-existing `unfriend` through editorial copy + haptics. Validate via `tsc --noEmit` (0 new errors over the ~39-error baseline) + a per-screen manual TestFlight checklist (no automated test framework exists).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Month grouping + filter/sort of moments | Screen (presentation transform) | — | Pure derivation over `usePoints` data (`useMemo`); not a data-fetch concern. Already done this way in `list.tsx`. |
| Moments data fetch | Hook (`usePoints.fetchMyPoints`) | Supabase (RLS) | Established pattern; unchanged this phase. |
| Friends data fetch + remove | Hook (`useFriends`) + store (`friendStore`) | Supabase (RLS friendships) | `fetchFriends`/`unfriend`/`removeFriend` already exist. |
| Partner-tag consent (Sceller/Décliner) | **Hook (new thin method)** | Supabase (RLS point_partners, mig. 010/011) | Currently done inline in `point/[id].tsx` (direct Supabase) — must be a hook to be called from `requests.tsx` per rule 4. |
| Confirmation dialog (unfriend) | Component (native `Alert`) | Hook (executes delete) | iOS-native `Alert` is the platform-correct confirm; the destructive action delegates to `useFriends`. |
| Haptic feedback | `lib/haptics` (fire-and-forget) | — | Centralized helper (FOND-03); never `await`. |
| Theming (dark/light) | `useTheme()` + `makeStyles(T)` | — | Per-component memoized recompute. |

## Standard Stack

**Zero new packages.** Everything required is already installed and in use.

### Core (existing, reused as-is)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-native` `SectionList`/`FlatList` | RN 0.81.5 | List rendering, month grouping (D-02) | `SectionList` is the RN-native primitive for grouped lists; already used in `list.tsx`. |
| `expo-router` | ~6.0.24 | Navigation (push to point detail, friend map view) | Established. |
| `@supabase/supabase-js` | ^2.43.4 | Data layer (behind hooks only) | Established; RLS-enforced. |
| `zustand` | ^4.5.4 | `friendStore` / `mapStore` | Established. |
| `react-native-paper` `Snackbar` | ^5.12.3 | Error / success toasts | Only Paper component used; established. |
| `expo-haptics` (via `lib/haptics`) | ~15.0.8 | Tap/select/success/warn/error feedback | FOND-03 helper present. |

### Supporting (existing primitives — reuse, do not re-implement)
| Asset | Path | Purpose | Phase 4 use |
|-------|------|---------|-------------|
| `Button` | `components/ui/Button.tsx` | variants `solid`/`coral`/`ghost`/`danger`/`underline` | Sceller/Accepter (`coral`/`solid`), Refuser/Décliner (`ghost`), Carte (`underline`). |
| `Input` | `components/ui/Input.tsx` | underline text field | Recherche « Rechercher dans le cercle » (D-05). |
| `SkeletonRow` | `components/ui/SkeletonItem.tsx` | loading skeleton | Preserve (D-04). |
| `PressableScale` | `components/ui/PressableScale.tsx` | spring scale on tap | Row tap feedback. |
| `AppText` | `components/ui/AppText.tsx` | bounded Dynamic Type | See ⚠️ caveat in Pitfalls (title variant = serif 400, NOT serifLight 300). |
| `haptics` | `lib/haptics.ts` | `tap/select/press/success/warn/error` | All map directly to the Motion contract. |
| Custom icons | `components/icons.tsx` | `IcoSearch`, `IcoCheck`, `IcoClose`, `IcoArrow`, etc. | No `@expo/vector-icons` (rule). |
| Tokens | `constants/theme.ts` (`T.*`) / `constants/fonts.ts` (`F.*`) | colors, radii (D-12), fonts | Never hardcode. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `SectionList` (D-02 grouping) | `FlatList` + manual section rows | UI-SPEC permits it, but `SectionList` already works and gives sticky headers for free. **Keep `SectionList`.** |
| Inline pill bar | Keep `FiltersBottomSheet` | D-03 explicitly removes the sheet. No. |
| Native `Alert` confirm | Custom modal | `Alert` is platform-correct, accessible, zero-cost, already used in `FriendItem`. **Keep `Alert`.** |

**Installation:** None. `npm install` adds nothing this phase.

## Package Legitimacy Audit

> **Not applicable** — this phase installs **zero external packages**. The UI-SPEC mandates "zéro nouvelle dépendance" and all required primitives already exist in the repo. No registry verification, slopcheck, or postinstall audit needed. If the planner introduces any package, this section must be re-run.

## Architecture Patterns

### System Architecture Diagram

```
                 ┌─────────────────────────────────────────────┐
                 │  Screen (presentation)                       │
   user taps     │  list.tsx / friends/index.tsx / requests.tsx │
   ─────────────▶│                                              │
                 │  useMemo: filter → groupByMonth → sections   │  ← pure transform (D-02/D-03)
                 └───────┬───────────────────────────┬──────────┘
                         │ render                     │ action (tap/accept/remove)
                         ▼                            ▼
          ┌──────────────────────┐         ┌──────────────────────────┐
          │ Row components        │         │ Hooks (data access)      │
          │ PointListItem         │         │ usePoints  / useFriends  │
          │ FriendItem (+Alert)   │         │ (+ NEW respondToTag?)    │
          │ FriendRequestItem     │         └────────────┬─────────────┘
          └──────────┬────────────┘                      │
                     │ haptics (fire-and-forget)         ▼ writes
                     ▼                          ┌──────────────────────┐
              lib/haptics                       │ Supabase (RLS)       │
                                                │ friendships /        │
          stores (zustand): friendStore ◀───────│ point_partners /     │
                            mapStore             │ points               │
                                                └──────────────────────┘
```

The data flow is unchanged except for the dashed **NEW respondToTag** path (Open Question Q1). Everything else is a presentation re-skin over identical data plumbing.

### Recommended File Touch-Map (no new structure)
```
app/(app)/(tabs)/point/list.tsx       # state swap (FiltersBottomSheet → inline pills), sticky headers
app/(app)/(tabs)/friends/index.tsx    # restyle, search via ui/Input, wire editorial unfriend copy
app/(app)/(tabs)/friends/requests.tsx # 2 sections (D-07), inline Sceller/Décliner (needs hook)
components/point/PointListItem.tsx     # note → Display 44 anchor (T.text), drop N°00X, chevron mono
components/friends/FriendItem.tsx      # nom serif Heading 20, Carte underline, Retirer T.danger + haptics
components/friends/FriendRequestItem.tsx # icon buttons → text buttons solid/ghost; props for amitié vs taguage
hooks/useFriends.ts OR hooks/usePoints.ts # (Q1) thin respondToTag(pointPartnerId, accept) if inline consent kept
components/point/FiltersBottomSheet.tsx # becomes unreferenced (Q3) — delete or leave dead
```

### Pattern 1: Screen-level transform (filter → group → sections)
**What:** Derive `SectionList` sections from raw `points` via memoized pure functions. Already implemented; reuse the `groupByMonth()` function verbatim.
**When to use:** D-02 month grouping + D-03 inline filtering.
**Example:** (`groupByMonth` from current `list.tsx`, lines 34-62 — keep). Replace the filter source from `FiltersBottomSheet` state with a 2-field inline state:
```typescript
// Source: VERIFIED in app/(app)/(tabs)/point/list.tsx (existing groupByMonth, lines 34-62)
type MinNote = 0 | 5 | 7 | 9;
type Sort = 'date' | 'note';
const [minNote, setMinNote] = useState<MinNote>(0);
const [sort, setSort] = useState<Sort>('date');

const sections = useMemo(() => {
  const filtered = points.filter((p) => p.note >= minNote);
  // map 'date' → 'date_desc', 'note' → 'note_desc' for existing groupByMonth signature
  return groupByMonth(filtered, sort === 'note' ? 'note_desc' : 'date_desc');
}, [points, minNote, sort]);
```
This drops the `partnerStatus`/`period`/`FilterSort` complexity that came from `FiltersBottomSheet` — D-03 only needs note-min + sort.

### Pattern 2: Sticky month headers
**What:** `SectionList` renders `renderSectionHeader` sticky by default on iOS. Current `list.tsx` sets `stickySectionHeadersEnabled={false}` (line 204). UI-SPEC §Liste point 3 wants **sticky** month headers.
**Action:** Remove that prop or set it to `true`. Keep the filter pill bar inside `ListHeaderComponent` so it scrolls away (correct — only month headers stick).

### Pattern 3: Editorial destructive confirm (D-06)
**What:** Native `Alert` with `destructive` style, delegating to the existing hook. Already present in `FriendItem.handleUnfriend` (lines 21-30) — needs copy + haptics update only.
```typescript
// Source: VERIFIED — components/friends/FriendItem.tsx already has this shape (lines 21-30)
function handleUnfriend() {
  haptics.warn(); // ADD (UI-SPEC §Destructive)
  Alert.alert(
    'Retirer du cercle ?',
    `${name} ne verra plus vos moments partagés. Cette action est irréversible.`,
    [
      { text: 'Garder', style: 'cancel' },
      { text: 'Retirer', style: 'destructive', onPress: onUnfriend },
    ]
  );
}
```
Success/failure snackbar + `haptics.error()` on failure are handled by the screen's `handleUnfriend` (`friends/index.tsx` lines 91-94, already wired — add the haptics + editorial snackbar copy).

### Anti-Patterns to Avoid
- **Re-fetching after `unfriend`:** `removeFriend(friendshipId)` already does an **optimistic store removal** (`friendStore.ts` lines 24-27). Don't add a `fetchFriends` round-trip — the list updates instantly.
- **Direct Supabase in components:** `requests.tsx` `handleCancel` (lines 131-139) already violates this with a raw `supabase...delete()`. Do NOT copy that pattern for the new taguage consent — route it through a hook (Q1).
- **Rose saturation:** UI-SPEC §Color explicitly overrides the *current* `PointListItem` (note rendered in `T.primary`). The note must become `T.text` (Display 44 anchored by scale, not color). The executor and checker must respect this deliberate departure.
- **`F.sans*` / `F.serifMedium` on these screens:** proscribed by UI-SPEC §Typography. Current `FriendItem`/`FriendRequestItem`/`requests.tsx` use `F.sans` for names — must move to `F.serif` italic Heading 20.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Remove a friend (delete + store update) | New Supabase delete in component | `useFriends().unfriend(id)` (**exists**, `useFriends.ts` 63-76) | Already implemented, RLS-safe, optimistic store update. |
| Friend-store removal | Manual `setFriends(filter)` | `friendStore.removeFriend(id)` (**exists**) | Called internally by `unfriend`. |
| Month grouping / sorting | New grouping util | `groupByMonth()` in `list.tsx` (**exists**, 34-62) | Handles FR month labels, multi-sort, year keying. |
| Confirmation dialog | Custom modal/sheet | RN `Alert` (already in `FriendItem`) | Platform-native, accessible, free. |
| Loading state | New spinner | `SkeletonRow` (**exists**) | D-04 preserves it. |
| Tap feedback | Custom Animated | `PressableScale` (**exists**) | Spring scale already used in `PointListItem`. |
| Haptics | Direct `expo-haptics` calls | `lib/haptics` (**exists**) | FOND-03 centralized mapping; fire-and-forget. |
| Buttons | New TouchableOpacity styles | `ui/Button` variants | `solid`/`coral`/`ghost`/`underline`/`danger` all cover D-07/D-05/D-06. |

**Key insight:** The data/behavior layer for this phase is already built. The *only* genuinely new logic is the partner-tag consent hook method (Q1), and even that is a copy-of-existing-inline-code-into-a-hook refactor.

## Common Pitfalls

### Pitfall 1: `AppText` title variant ≠ serifLight (300)
**What goes wrong:** UI-SPEC §Typography wants Display (44) and Title (36) in **`F.serifLight` (300, italic)**. But `AppText`'s `title` variant maps to **`F.serif` (400)** (`AppText.tsx` line 14, `VARIANT_FONT.title = F.serif`). Using `<AppText variant="title">` for the screen titles or the note anchor yields the **wrong weight**.
**Why it happens:** `AppText` is intentionally "thin" (3 fixed variants); it was not built to express the 300 weight.
**How to avoid:** For Display/Title (300), either set `fontFamily: F.serifLight` directly in `makeStyles` (current pattern — all three screens already do this) **or** pass a `style={{ fontFamily: F.serifLight }}` override to `AppText`. Do **not** rely on `variant="title"` alone for 300-weight text. AppText still adds value for `maxFontSizeMultiplier` bounding.

### Pitfall 2: requests.tsx currently has THREE sections, D-07 specifies TWO
**What goes wrong:** Current screen renders Taguages + Reçues + **Envoyées** (sent, with "Annuler"). D-07 §Demandes locks **two** sections (Reçues + Taguages). Silently keeping a 3rd section contradicts the contract; silently dropping it removes the ability to cancel a sent request.
**How to avoid:** Surface as an explicit planning decision (Q2). Recommendation: keep the *behavior* but confirm with the user whether "Envoyées" stays as a styled 3rd section or is dropped. If kept, its `handleCancel` direct-Supabase (lines 131-139) should move to a `useFriends.cancelRequest()` hook (rule 4).

### Pitfall 3: Inline taguage consent needs a hook (no Supabase in components)
**What goes wrong:** D-07 wants inline **Sceller/Décliner** in `requests.tsx`, but consent is currently a direct `supabase.from('point_partners').update({status})` **inside `point/[id].tsx`** (lines 155-156) — there is **no hook**. Putting that update directly in `requests.tsx` breaks rule 4.
**How to avoid:** Add a thin hook method (Q1), e.g. `usePoints().respondToTag(pointPartnerId, accept)` or a small `useTags` hook. It is a **mono-table** update on `point_partners.status` → RLS-safe (mig. 010/011 grant the tagged partner access), no cross-table recursion (rule 18 satisfied). The `on_partner_consent` trigger flips `is_visible` server-side — never touch `is_visible` from the client (CLAUDE.md DB rule).

### Pitfall 4: `FiltersBottomSheet` becomes dead code
**What goes wrong:** After D-03, `list.tsx` no longer imports it. Grep confirms it is referenced in **code** only by `list.tsx` (and itself). Leaving the import while removing usage causes an unused-import lint error; leaving the file orphaned is dead code.
**How to avoid:** Remove the import + usage from `list.tsx`; then either delete `components/point/FiltersBottomSheet.tsx` or leave it intentionally (planner decision Q3). Note `DEFAULT_FILTERS`/`countActiveFilters`/`FilterSort` types are also only used by `list.tsx` — they go away with the inline state.

### Pitfall 5: Stats row in list.tsx is not in the UI-SPEC
**What goes wrong:** Current `list.tsx` header renders an "Entrées / Moy." stats block (lines 153-171) and a "le carnet / Vos moments" eyebrow+title. UI-SPEC §Liste structure is: Title « Le carnet » → filter pills → sections. No stats row, and title copy changes to « Le carnet » (was « Vos moments »).
**How to avoid:** Plan should explicitly state whether the stats row is dropped (recommended — not in the contract, belongs to the table-of-contents archetype's restraint) or kept. Default: drop it to match the spec.

### Pitfall 6: Search currently uses raw `TextInput`, not `ui/Input`
**What goes wrong:** `friends/index.tsx` builds search with a raw `TextInput` + `IcoSearch` (lines 112-123). D-05 wants the underline `ui/Input` with placeholder « Rechercher dans le cercle ». The debounced `search_users` RPC logic (lines 68-77) is fine and should be preserved.
**How to avoid:** Swap the presentation to `ui/Input` (or keep the underline row but align copy/typography); keep the 300ms debounce + RPC unchanged.

## Code Examples

### Inline filter pill (D-03) — active/inactive states
```typescript
// Source: pattern derived from FiltersBottomSheet Opt (VERIFIED components/point/FiltersBottomSheet.tsx 106-119)
// but rendered inline as a pill row in ListHeaderComponent.
function FilterPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const T = useTheme();
  return (
    <PressableScale onPress={() => { haptics.select(); onPress(); }}
      style={{
        paddingHorizontal: 12, height: 44, justifyContent: 'center',
        borderRadius: T.pill, borderCurve: 'continuous',          // D-12
        backgroundColor: active ? T.primary : 'transparent',
        borderWidth: active ? 0 : 1, borderColor: T.border,
      }}>
      <Text style={{ fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5,
        textTransform: 'uppercase', color: active ? T.text : T.textDim }}>{label}</Text>
    </PressableScale>
  );
}
```

### Partner-tag consent hook method (Q1 recommendation)
```typescript
// Source: extracted from VERIFIED inline logic in app/(app)/point/[id].tsx (lines 155-156)
// Add to a hook (e.g. usePoints) — mono-table, RLS-safe (mig 010/011), rule 18 OK.
const respondToTag = useCallback(async (pointPartnerId: string, accept: boolean): Promise<boolean> => {
  const { error } = await supabase
    .from('point_partners')
    .update({ status: accept ? 'accepted' : 'rejected' })
    .eq('id', pointPartnerId);
  if (error) { console.error('[usePoints] respondToTag error:', error.message); return false; }
  return true; // is_visible flips server-side via on_partner_consent trigger — never set client-side
}, []);
```

## State of the Art

| Old Approach (current code) | Current Approach (Phase 4 target) | Why |
|--------------|------------------|-----|
| Note rendered in `T.primary` (`PointListItem`) | Note in `T.text`, Display 44 (anchored by scale) | UI-SPEC §Color — avoid rose saturation across ~30 rows. |
| `N°00X` mono index per row | Removed | D-01 — note IS the anchor; second index clutters. |
| Filters in `FiltersBottomSheet` (modal) | Inline pills (note-min + sort) | D-03 — zero sheet, avoids iOS 26 sheet quirks. |
| `stickySectionHeadersEnabled={false}` | sticky month headers | D-02 §Liste. |
| Friend name in `F.sans` 14 | `F.serif` italic 20 (Heading) | UI-SPEC §Typography. |
| Request actions = icon buttons (`IcoCheck`/`IcoClose`) | text buttons (solid/ghost) | D-07. |
| Taguage = "Répondre →" navigation to detail | inline Sceller/Décliner | D-07 (requires hook, Q1). |

**Deprecated/outdated for this phase:**
- `FiltersBottomSheet` usage on `list.tsx` (component may be deleted).
- The stats row + « Vos moments » title in `list.tsx` (replaced by « Le carnet »).

## Runtime State Inventory

> Not applicable — this is a greenfield-style UI redesign, **not** a rename/refactor/migration. No stored keys, service config, OS registrations, secrets, or build artifacts encode any string being renamed. Verified: the only data writes are the existing `unfriend` (delete by `friendship.id`) and the proposed `respondToTag` (update `point_partners.status`), both mono-table operations on existing schema.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | tsc baseline is ~39 pre-existing errors (per STATE.md); gate = 0 *new* errors | Validation Architecture | If baseline count drifted, the "0 new" gate needs a fresh baseline capture before the phase. Low risk — re-run `npm run typecheck` at Wave 0. |
| A2 | The "Envoyées" (sent requests) section should be reconciled with D-07's "two sections" — not silently kept or dropped | Pitfall 2 / Q2 | If user wanted sent-requests preserved and it's dropped, a function regresses. Mitigated by raising Q2. |
| A3 | Inline taguage consent is desired (vs keeping "Répondre →" navigation) per UI-SPEC §Demandes | Q1 | If navigation is acceptable, no hook needed and the phase is simpler. Mitigated by raising Q1. |

## Open Questions

1. **Inline partner-tag consent — add a hook, or keep navigation?** (Q1)
   - What we know: UI-SPEC D-07 §Demandes specifies inline **Sceller/Décliner** buttons on the taguage section. Consent today is a direct `supabase.from('point_partners').update({status})` **inside `point/[id].tsx`** (lines 155-156); no hook exists. Rule 4 forbids Supabase in components.
   - What's unclear: Whether the planner/user wants the full inline-consent behavior (needs a new thin hook + the `is_visible` trigger handles visibility) or accepts keeping the current "Répondre →" navigation to point detail (no hook, but a literal departure from D-07's "boutons texte" actions).
   - Recommendation: **Add `respondToTag(pointPartnerId, accept)` to a hook** (see Code Examples) and optionally refactor `point/[id].tsx` to call it (reduces the existing rule-4 violation). Mono-table, RLS-safe (mig 010/011), rule 18 OK.

2. **"Envoyées" (sent requests) section — keep, restyle, or drop?** (Q2)
   - What we know: D-07 locks **two** sections (Reçues + Taguages). Current `requests.tsx` has a 3rd "Envoyées" section with an "Annuler" action whose `handleCancel` does direct Supabase (lines 131-139).
   - What's unclear: Whether removing it loses a needed capability (cancelling an outgoing request).
   - Recommendation: Confirm with user. If kept, move `handleCancel` to `useFriends.cancelRequest()` (rule 4) and style it as a discreet 3rd block; if dropped, note it as an intentional scope reduction.

3. **Delete `FiltersBottomSheet.tsx` or leave it?** (Q3)
   - What we know: After D-03 it is referenced in code only by `list.tsx`. Removing the usage orphans it.
   - Recommendation: Delete it (and its now-unused exported types) to keep the tree clean, unless a future phase is known to need it. Low-stakes — planner's call.

## Validation Architecture

> `nyquist_validation: true` in config → section required. **No automated test framework exists** (no jest/vitest/playwright in `package.json`). Validation = static gates + a manual TestFlight checklist. This is correct and sufficient for a presentation-layer redesign.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **None** (no unit/e2e runner installed) — static analysis + manual device validation |
| Config file | `tsconfig.json` (strict) ; `.eslintrc` via `eslint-config-expo` |
| Quick run command | `npm run typecheck` (`tsc --noEmit`) |
| Full suite command | `npm run typecheck && npm run lint` |
| Baseline | ~39 pre-existing tsc errors (Supabase `never` types) per STATE.md — gate is **0 NEW errors** |

### Phase Requirements → Validation Map
| Req ID | Behavior | Validation Type | Automated Command | Manual Check |
|--------|----------|-----------------|-------------------|--------------|
| UI-05 | Months grouped, sticky headers, note=Display44 `T.text`, no N°00X, inline pills filter/sort | static + manual | `npm run typecheck` (0 new) | TestFlight: scroll list, toggle each pill (note-min 0/5/7/9+, Date/Note), verify section order + sticky month headers + pull-to-refresh + skeleton + error snackbar |
| UI-05 | Filter correctness | manual | — | Set "9+" → only notes ≥9 show; toggle "Note" → rows sorted by note desc within month |
| UI-06 | Annuaire restyle (serif name, square rose avatar, Carte underline), search underline | static + manual | `npm run typecheck` | TestFlight: search a name, tap « Carte » (opens map in friend view), dark+light both |
| UI-06 | Unfriend confirm + removal | manual | — | Tap « Retirer » → editorial Alert (« Retirer du cercle ? ») → confirm → row disappears instantly + « Retiré du cercle. » snackbar + warn haptic; cancel keeps row |
| UI-07 | Two sections, Accepter/Refuser + Sceller/Décliner text buttons, empty state | static + manual | `npm run typecheck` | TestFlight: accept a friend request (success haptic + snackbar), refuse one (warn), seal/decline a taguage, verify empty « Pas de page en attente. » when both empty, single-empty section hidden |

### Sampling Rate
- **Per task / commit:** `npm run typecheck` (must show 0 new errors over baseline).
- **Per screen merge:** `npm run typecheck && npm run lint` green.
- **Phase gate:** Full static suite green **+** complete manual TestFlight checklist (per-screen, dark **and** light) before `/gsd:verify-work`. Per CLAUDE.md workflow: `git push` + `eas update` after each change.

### Wave 0 Gaps
- [ ] Capture a fresh tsc baseline error count (`npm run typecheck`) before edits, so "0 new errors" is measurable (A1).
- [ ] No test files to create — none exist and none are introduced (manual validation is the project standard).
- [ ] Decide Q1/Q2/Q3 before planning the `requests.tsx` and `list.tsx` tasks.

## Security Domain

> `security_enforcement` absent in config → enabled. Scope is narrow (UI re-skin over existing RLS-protected data), but the destructive `unfriend` and the new `respondToTag` touch user data.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | Session handled upstream; screens assume authed user. |
| V4 Access Control | **yes** | Supabase RLS on `friendships` / `point_partners` / `points`. `unfriend` deletes by `friendship.id` (RLS scopes to rows the user participates in). `respondToTag` updates `point_partners` where `partner_id = auth.uid()` (mig 010/011). Never service-key client-side. |
| V5 Input Validation | minimal | No free-form server input added; search uses existing `search_users` RPC (sanitized, excludes `date_of_birth`/`push_token`). |
| V6 Cryptography | no | None introduced. |

### Known Threat Patterns for this stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Removing/consenting on a row you don't own | Elevation of Privilege | RLS policies (existing); operations keyed by row id, scoped server-side. Rule 18: both ops are mono-table → no cross-table policy recursion (`42P17`). |
| Client flipping `is_visible` directly | Tampering | Forbidden by CLAUDE.md DB rule; `is_visible` only via `on_partner_consent` trigger. `respondToTag` updates `status` only. |
| Leaking another user's `push_token`/`date_of_birth` | Information Disclosure | `search_users` RPC already excludes these; no new profile fields surfaced. |
| Direct Supabase in component (`requests.tsx handleCancel`) | (maintainability/security hygiene) | Move to a hook (Q2) — keeps RLS the single enforcement boundary and avoids ad-hoc queries. |

## Sources

### Primary (HIGH confidence — codebase, VERIFIED via Read/Grep this session)
- `app/(app)/(tabs)/point/list.tsx` — existing `SectionList` + `groupByMonth` + `FiltersBottomSheet` coupling, sticky=false, stats row.
- `app/(app)/(tabs)/friends/index.tsx` — `unfriend`/`handleUnfriend` already wired, raw `TextInput` search, debounced `search_users`.
- `app/(app)/(tabs)/friends/requests.tsx` — 3 sections, `FriendRequestItem` (received only), `handleCancel` direct Supabase, taguages as "Répondre →".
- `hooks/useFriends.ts` — `unfriend` (63-76), `respondToRequest`, `sendFriendRequest` (all exist).
- `stores/friendStore.ts` — `removeFriend` optimistic removal (24-27).
- `hooks/usePoints.ts` — `fetchMyPoints`, no partner-consent method (confirms Q1 gap).
- `app/(app)/point/[id].tsx` (Grep) — consent via direct `point_partners.update({status})` (155-156), « Sceller » copy.
- `components/point/PointListItem.tsx`, `components/friends/FriendItem.tsx` (has `Alert`), `components/friends/FriendRequestItem.tsx`.
- `components/ui/Button.tsx`, `Input.tsx`, `AppText.tsx` (title→F.serif 400 caveat), `components/point/FiltersBottomSheet.tsx`.
- `constants/theme.ts`, `constants/fonts.ts`, `lib/haptics.ts`.
- `package.json` (no test framework), `tsconfig.json` (strict), `.planning/config.json` (`nyquist_validation: true`).
- `.planning/phases/04-listes-cercle/04-CONTEXT.md`, `04-UI-SPEC.md`; `.planning/REQUIREMENTS.md`; `.planning/STATE.md`; `.planning/research/FEATURES.md` (archetype).

### Secondary / Tertiary
- None — no web/Context7 lookups needed (zero new dependencies; all answers in-repo).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; every primitive verified present in repo.
- Architecture: HIGH — data/behavior layer already exists; only a presentation re-skin + one hook extraction.
- Pitfalls: HIGH — each is grounded in a specific line range read this session.
- Open questions: the 3 Qs are genuine planning decisions, not knowledge gaps.

**Research date:** 2026-06-02
**Valid until:** 2026-07-02 (stable — pure in-repo redesign; only invalidated if the 3 screens or `useFriends`/`usePoints` are edited before planning)

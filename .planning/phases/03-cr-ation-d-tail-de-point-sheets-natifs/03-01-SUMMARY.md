---
phase: 03-cr-ation-d-tail-de-point-sheets-natifs
plan: 01
subsystem: ui
tags: [expo-router, react-native-screens, formSheet, navigation, stack, tabs, ios]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: react-native-screens 4.16.0, gesture-handler root, runtimeVersion fingerprint
provides:
  - "(app)/_layout.tsx as a Stack declaring (tabs) group + point/new + point/[id] as native formSheet routes"
  - "app/(app)/(tabs)/ route group holding the 5 relocated tab screens + relocated Tabs navigator"
  - "IOS-01 native form sheet presentation live (detents [0.92], grabber, cornerRadius 28, gestureEnabled)"
  - "IOS-02 navigation restructure foundation (point/* off hidden full-screen tabs onto sibling Stack routes)"
affects: [03-02, 03-03, 03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Expo Router canonical: Stack parent + (tabs) route group + formSheet sibling routes"
    - "Route group (parens) keeps URL hrefs unchanged after folder relocation"
    - "Session guard lives in the (app) Stack parent; (tabs) layout renders guard-free under it"

key-files:
  created:
    - "app/(app)/(tabs)/_layout.tsx"
  modified:
    - "app/(app)/_layout.tsx"
    - "app/(app)/(tabs)/map/index.tsx (moved)"
    - "app/(app)/(tabs)/point/list.tsx (moved)"
    - "app/(app)/(tabs)/friends/index.tsx (moved)"
    - "app/(app)/(tabs)/friends/requests.tsx (moved)"
    - "app/(app)/(tabs)/profile/index.tsx (moved)"

key-decisions:
  - "Narrowed only `presentation` to its literal (`'formSheet' as const`) instead of a blanket `as const` on the whole sheetOptions object, to avoid a readonly-tuple tsc error on sheetAllowedDetents"
  - "Session guard kept verbatim in the (app) Stack parent; (tabs)/_layout.tsx carries no guard"
  - "Used git mv for all 5 relocations to preserve file history (renames recorded at 100%)"

patterns-established:
  - "Stack parent + (tabs) group + formSheet sibling routes (the only correct Expo Router structure for sheets over a tab bar)"
  - "Shared sheetOptions const with per-field literal narrowing for native-stack option type-safety"

requirements-completed: [IOS-01, IOS-02]

# Metrics
duration: ~20min
completed: 2026-06-02
---

# Phase 3 Plan 01: Navigation restructure for native form sheets Summary

**`(app)` navigation rewritten from Tabs to a Stack: the 5 tab screens moved into a new `(tabs)` route group, and `point/new` + `point/[id]` are now native iOS `formSheet` Stack routes (slide-up, grabber, detent [0.92]) — tsc-clean with route hrefs and notification deep-links intact.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-06-02
- **Completed:** 2026-06-02
- **Tasks:** 2
- **Files modified:** 7 (1 created, 1 rewritten, 5 relocated)

## Accomplishments
- New `app/(app)/(tabs)/_layout.tsx` holds the relocated `Tabs` navigator (TabIcon helper + tab-bar opaque background preserved, CLAUDE.md rule 13 intact).
- 5 tab screens relocated under `(tabs)/` via `git mv` (history preserved, renames at 100% similarity); `point/new.tsx` + `point/[id].tsx` stay at `(app)/point/` as siblings of the tab group.
- `(app)/_layout.tsx` rewritten as a `<Stack>` declaring `(tabs)` + the two `formSheet` routes (`presentation: 'formSheet'`, `sheetAllowedDetents: [0.92]`, `sheetGrabberVisible: true`, `sheetCornerRadius: 28`, `gestureEnabled: true`, `headerShown: false`), with `contentStyle: { backgroundColor: T.bg }` to mitigate the swipe-dismiss flash.
- Session guard preserved verbatim in the Stack parent (redirect to `/(auth)/login`, `if (!session) return null`).
- Routing-integrity gate passed: `tsc` shows 38 errors = baseline, **0 new**. The moved screens carry their pre-existing baseline errors into `(tabs)/`; no new route-resolution errors for `router.replace('/(app)/map')`, `router.push('/(app)/point/'+id)`, the FAB/long-press `point/new` push, or the notification deep-links in `app/_layout.tsx`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the (tabs) group and relocate the 5 tab screens** - `20751cb` (refactor)
2. **Task 2: Rewrite (app)/_layout.tsx as a Stack with formSheet routes** - `dcb11ad` (refactor)

## Files Created/Modified
- `app/(app)/(tabs)/_layout.tsx` - NEW. Relocated `<Tabs>` navigator (TabIcon, 4 visible tabs + hidden `friends/requests` href:null, opaque tab-bar styles). No session guard.
- `app/(app)/_layout.tsx` - Rewritten Tabs → Stack. Declares `(tabs)` group + `point/new` + `point/[id]` as `formSheet` routes; session guard kept verbatim; `contentStyle` background set.
- `app/(app)/(tabs)/map/index.tsx` - Moved (content unchanged).
- `app/(app)/(tabs)/point/list.tsx` - Moved (content unchanged).
- `app/(app)/(tabs)/friends/index.tsx` - Moved (content unchanged).
- `app/(app)/(tabs)/friends/requests.tsx` - Moved (content unchanged, stays href:null in Tabs).
- `app/(app)/(tabs)/profile/index.tsx` - Moved (content unchanged).

## Decisions Made
- **Per-field literal narrowing instead of blanket `as const`:** the plan specified `sheetOptions ... as const`, but a full `as const` types `sheetAllowedDetents` as `readonly [0.92]`, which is not assignable to the `number[]` expected by `ExtendedStackNavigationOptions` (2 new TS2322 errors). Narrowing only `presentation: 'formSheet' as const` keeps the literal where the option union needs it while leaving the array/booleans/numbers inferred as mutable — same runtime behavior, tsc-clean. This is research Assumption A1 ("verify at tsc") materializing.
- **`git mv` for relocations** to preserve history (renames at 100%).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Adjusted `sheetOptions` typing to satisfy the tsc routing-integrity gate**
- **Found during:** Task 2 (Rewrite (app)/_layout.tsx as a Stack)
- **Issue:** The plan's literal `as const` on the whole `sheetOptions` object produced 2 NEW `TS2322` errors (lines 28-29): the `readonly [0.92]` tuple from `as const` is not assignable to the mutable `number[]` that `ExtendedStackNavigationOptions.sheetAllowedDetents` expects. This violated the acceptance criterion "0 NEW errors vs the 38-error baseline."
- **Fix:** Replaced the trailing `} as const;` with per-field narrowing — `presentation: 'formSheet' as const` only — so `presentation` stays a literal (assignable to the presentation union) while `sheetAllowedDetents` infers as `number[]`. Added a clarifying comment.
- **Files modified:** `app/(app)/_layout.tsx`
- **Verification:** `npx tsc --noEmit` → 38 errors, exactly the baseline; the only `_layout.tsx` error is the pre-existing `'loading'` baseline error (kept verbatim per plan). The two TS2322 sheet-option errors are gone.
- **Committed in:** `dcb11ad` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking).
**Impact on plan:** The fix is a minimal, behavior-preserving typing adjustment required to pass the routing-integrity gate. No scope creep; sheet option values are unchanged.

## Issues Encountered
None beyond the deviation above. All `rg` structural assertions passed first try; the folder move produced clean renames with no relative-import breakage (all screens use the `@/` alias).

## Known Stubs
None. This plan is a pure structural move + route declarations; no placeholder data or unwired components introduced.

## User Setup Required
None - no external service configuration required. Zero new dependencies (D-01) → no native rebuild required for this plan; OTA `eas update` remains valid.

## Next Phase Readiness
- The two `formSheet` routes (`point/new`, `point/[id]`) are declared and tsc-clean — Plans 03-02/03-03/03-04 (PointMarker Modal removal, creation-sheet redesign, detail-sheet redesign) can build on this structure.
- **Device validation deferred to the phase gate (Plan 05):** the actual sheet presentation (slide-up, grabber, swipe-to-dismiss, detent rendering on iOS 26 per #3235) must be verified on TestFlight, not the simulator. Static gates (tsc) pass; visual/interaction acceptance is manual.

## Self-Check: PASSED

- All created/relocated files exist on disk (`(tabs)/_layout.tsx`, rewritten `(app)/_layout.tsx`, 5 relocated screens, `point/new.tsx` + `point/[id].tsx` still at `(app)/point/`).
- Both task commits exist in git history (`20751cb`, `dcb11ad`).
- `tsc` 38 errors = baseline, 0 new.

---
*Phase: 03-cr-ation-d-tail-de-point-sheets-natifs*
*Completed: 2026-06-02*

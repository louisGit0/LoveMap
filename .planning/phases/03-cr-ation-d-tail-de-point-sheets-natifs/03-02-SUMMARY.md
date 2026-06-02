---
phase: 03-cr-ation-d-tail-de-point-sheets-natifs
plan: 02
subsystem: ui
tags: [rnmapbox, point-annotation, expo-router, modal-removal, map, ios]

# Dependency graph
requires:
  - phase: 03-cr-ation-d-tail-de-point-sheets-natifs
    provides: "(app)/point/[id] declared as a native formSheet Stack route (Plan 03-01)"
  - phase: 02-carte-stylis-e
    provides: "PointMarker selected-state visual (PinIcon <-> PinIconSelected via refresh()), staggered marker mount, FAB squircle"
provides:
  - "Lean PointMarker: a navigating PointAnnotation (onSelected -> router.push('/(app)/point/[id]')), no custom preview Modal"
  - "map/index.tsx free of dead delete plumbing (handleDelete + deletePoint + Alert removed)"
  - "IOS-02 'Modal custom -> native route' half complete (D-06): tap-pin opens the native detail sheet directly"
affects: [03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PointAnnotation onSelected navigates to a route instead of opening a JS Modal"
    - "onDeselected resets local selected state to mitigate the iOS re-tap quirk (Pitfall 3)"
    - "Delete is a single-entry-point action (detail sheet only) — no duplicate delete chrome on the map"

key-files:
  created: []
  modified:
    - "components/map/PointMarker.tsx"
    - "app/(app)/(tabs)/map/index.tsx"

key-decisions:
  - "Used a template literal `router.push(`/(app)/point/${point.id}`)` instead of the plan's string concatenation, to keep expo-router typed-route (Href) compatibility — concatenation widens to plain string and breaks the typed-route union"
  - "Delete capability lives only in the detail sheet now; removing the Modal removed a second (redundant) delete entry point with zero functionality loss (threat T-03-04 accepted)"

patterns-established:
  - "Pin tap = native navigation (router.push) — the map no longer renders any custom JS sheet"
  - "Selected-state visual preserved via re-snapshot (refresh()), reset on deselect"

requirements-completed: [IOS-02]

# Metrics
duration: ~12min
completed: 2026-06-02
---

# Phase 3 Plan 02: PointMarker Modal removal + direct detail navigation Summary

**Tapping a map pin now opens the native detail form sheet directly via `router.push('/(app)/point/[id]')` — the entire custom preview `<Modal>` (subtree + styles + state + isOwner/onDelete props) is gone from `PointMarker`, and the orphaned `handleDelete`/`deletePoint`/`Alert` plumbing is removed from the map screen. Delete remains fully available from the detail sheet; tsc-clean (38 = baseline, 0 new).**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-02
- **Completed:** 2026-06-02
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- `PointMarker.tsx` reduced from 369 to ~120 lines: the `<Modal>` preview subtree, its entire `makeStyles` block, the `modalVisible` state, and the `isOwner`/`onDelete` props are removed; now-unused imports/helpers (`Modal`, `TouchableOpacity`, `TouchableWithoutFeedback`, `Text`, `StyleSheet`, `useMemo`, `IcoTrash`, `F`, `formatDuration`, `formatDateRelative`) are gone.
- `onSelected` now `setSelected(true)` + `router.push(`/(app)/point/${point.id}`)` (the native detail sheet route from Plan 03-01); `onDeselected` resets `selected` (iOS re-tap quirk mitigation, Pitfall 3).
- Phase 2 selected-state visual preserved verbatim: `PinIcon ↔ PinIconSelected` swap + `annRef.current?.refresh()` re-snapshot on `[selected]`.
- `map/index.tsx`: `handleDelete` deleted; `<PointMarker>` call-site passes only `key` + `point`; the now-orphaned `deletePoint` destructure and `Alert` import removed. FAB, staggered markers, heatmap toggle, and `handleFabPress`/`handleLongPress` creation entry points (with `haptics.press()`) untouched.
- Static gate passed: `npx tsc --noEmit` → 38 errors = baseline, **0 new**; zero errors in either touched file; structural `rg` assertions all green (no `Modal`/`isOwner`/`onDelete`/`handleDelete`/`deletePoint`/`Alert`).

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove the preview Modal from PointMarker and navigate on select** - `54631e7` (refactor)
2. **Task 2: Clean up dead delete plumbing in map/index.tsx** - `b06d80a` (refactor)

## Files Created/Modified
- `components/map/PointMarker.tsx` - Stripped to pins + a navigating `PointAnnotation`. Modal subtree (150-234), all Modal-only styles (240-369), `modalVisible` state, `isOwner`/`onDelete` props, and orphaned imports/helpers removed. `onSelected` → `router.push('/(app)/point/[id]')`; `onDeselected` resets selected.
- `app/(app)/(tabs)/map/index.tsx` - `handleDelete` removed; `<PointMarker key={p.id} point={p} />` call-site; `deletePoint` destructure and `Alert` import removed. Creation/FAB/markers/heatmap intact.

## Decisions Made
- **Template literal over string concatenation for the navigation target.** The plan's action text specified `router.push('/(app)/point/' + point.id)`, but a runtime string concatenation widens to plain `string`, which is not assignable to expo-router's typed-route `Href` union (new `TS2345`). A template literal `router.push(`/(app)/point/${point.id}`)` — the exact form the original Modal already used and which was part of the 38-error baseline — preserves typed-route compatibility while still satisfying the `router.push` → `/(app)/point/` acceptance. Same runtime behavior.
- **Delete is now single-entry-point** (detail sheet only). Removing the Modal removed the redundant on-map delete; RLS-guarded `usePoints.deletePoint` from `point/[id].tsx` is unchanged (threat T-03-04 accepted, zero functionality loss).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Switched the navigation target from string concatenation to a template literal**
- **Found during:** Task 1 (Remove the preview Modal from PointMarker)
- **Issue:** The plan's literal `router.push('/(app)/point/' + point.id)` produced 1 NEW `TS2345` error at `PointMarker.tsx:116` — string concatenation widens to plain `string`, which does not match expo-router's typed-route `Href` union. This pushed the total to 39 (baseline is 38), violating the "0 new errors" gate.
- **Fix:** Used `router.push(`/(app)/point/${point.id}`)` — the type-safe template-literal form the original Modal already used. Still matches the `router.push` / `/(app)/point/` acceptance assertion and the `key_links` pattern.
- **Files modified:** `components/map/PointMarker.tsx`
- **Verification:** `npx tsc --noEmit` → 38 errors = baseline, 0 in `PointMarker.tsx`; `rg "router.push" components/map/PointMarker.tsx` matches `/(app)/point/`.
- **Committed in:** `54631e7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug).
**Impact on plan:** A one-character, behavior-preserving typing fix required to pass the tsc gate. No scope creep; the route target and runtime behavior are identical to the intent.

## Issues Encountered
- **ESLint is not configured at the repo root.** The project's `lint` script (`eslint . --ext .ts,.tsx`) has no flat/legacy config file present, so `eslint` cannot run on any file in this repo — a pre-existing tooling condition, NOT introduced by this plan. The plan's "eslint clean on touched files" gate is therefore non-evaluable. Substitute guarantee: the targeted `rg` assertions confirm every orphaned identifier (`Alert`, `deletePoint`, `handleDelete`, `isOwner`, `onDelete`, `Modal`) is removed, and `tsc` is clean (38 = baseline) — so there are no orphaned imports/vars. Adding an eslint config was deliberately not done (out-of-scope tooling change, scope boundary).

## Known Stubs
None. This plan removes code (a custom Modal + dead handlers) and rewires one navigation call; no placeholder data or unwired components introduced. Delete still works (detail sheet).

## User Setup Required
None - no external service configuration required. Zero new dependencies (D-01) → no native rebuild required for this plan; the change is JS-only and OTA-compatible (device validation of the tap-pin → sheet flow remains the Plan 05 gate).

## Next Phase Readiness
- IOS-02's "Modal custom → native route" half is complete: tap-pin opens the native detail sheet directly. Plan 03-04 (detail-sheet redesign "page de carnet" + date segments + native dismiss) builds on the now-active route.
- **Device validation deferred to the phase gate (Plan 05):** tap-pin → sheet opens, re-tapping the same pin re-opens it (the `onDeselected` reset is the documented mitigation for the iOS re-selection quirk, Pitfall 3 / threat T-03-05 accepted), and delete-from-sheet must be confirmed on TestFlight. Static gate (tsc) passes; interaction acceptance is manual.

## Self-Check: PASSED

- Both touched files exist on disk with the changes applied (`components/map/PointMarker.tsx`, `app/(app)/(tabs)/map/index.tsx`).
- Both task commits exist in git history (`54631e7`, `b06d80a`).
- `tsc` 38 errors = baseline, 0 new; 0 errors in either touched file.

---
*Phase: 03-cr-ation-d-tail-de-point-sheets-natifs*
*Completed: 2026-06-02*

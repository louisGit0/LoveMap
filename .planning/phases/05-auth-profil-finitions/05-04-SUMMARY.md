---
phase: 05-auth-profil-finitions
plan: 04
subsystem: ui
tags: [react-native, dynamic-type, safe-area, ios, insets, accessibility, maxFontSizeMultiplier]

# Dependency graph
requires:
  - phase: 05-01
    provides: "AppText display variant + per-role Dynamic Type caps (role table 1.15/1.25/1.3/1.8/1.2)"
  - phase: 05-02
    provides: "insets.bottom + 32 home-indicator pattern established on refonte screens"
  - phase: 05-03
    provides: "tsc baseline 20 (gate '0 new error' = 20 for remaining Phase 5 plans)"
provides:
  - "IOS-04 cross-cutting polish complete on the 6 non-refonte screens (home-indicator insets + Dynamic Type hero caps)"
  - "All 9 screens now safe-area / Dynamic Type / opaque-tab-bar consistent (D-07)"
  - "Final milestone pass — Phase 5 4/4, milestone v1.0 code-complete"
affects: [build-de-phase, validation-device, milestone-v1.0]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Home-indicator clearance on tab list screens: insets.bottom + 64 (replaces magic literal 100, scales with home indicator, clears opaque tab bar)"
    - "Hero Dynamic Type cap via per-instance maxFontSizeMultiplier on raw Text (serifLight title 1.25, serifLight Display 1.15) — lowest-risk surgical alternative to routing through AppText"

key-files:
  created:
    - .planning/phases/05-auth-profil-finitions/05-04-SUMMARY.md
  modified:
    - app/(app)/(tabs)/point/list.tsx
    - app/(app)/(tabs)/friends/index.tsx
    - app/(app)/(tabs)/friends/requests.tsx
    - app/(app)/point/new.tsx
    - app/(app)/point/[id].tsx

key-decisions:
  - "Used insets.bottom + 64 (not + 32) for the three list/social screens to preserve the prior ~100px visual clearance over the opaque 83px tab bar while tying to the home indicator — matches plan fallback guidance"
  - "Capped each screen's single layout-critical hero only (Pitfall 3: not every Text) via maxFontSizeMultiplier on the raw Text rather than restructuring into AppText — minimal blast radius, 0 churn on handlers"
  - "map/index needs no in-file hero cap: its only raw Text is the 10px mono hint; the large header text lives in the shared MapHeader component (out of scope, do not edit primitives)"

patterns-established:
  - "IOS-04 sweep discipline: fix only real breaks, verify the rest, never rewrite a coherent screen"

requirements-completed: [IOS-04]

# Metrics
duration: 14min
completed: 2026-06-02
---

# Phase 5 Plan 04: IOS-04 Finitions Sweep Summary

**Home-indicator padding tied to insets.bottom (+64) and Dynamic Type hero caps (1.25 serifLight title / 1.15 serifLight Display) applied surgically to the 6 non-refonte screens — final milestone polish, both themes, 0 new tsc errors.**

## Performance

- **Duration:** ~14 min
- **Completed:** 2026-06-02
- **Tasks:** 2
- **Files modified:** 5 (+ map/index verified, unchanged)

## Accomplishments
- Reconciled the magic `paddingBottom: 100` on the three tabs list/social screens (point/list, friends/index, friends/requests) to `insets.bottom + 64` — clears the opaque tab bar and scales with the home indicator on every device.
- Capped each of the three screens' single serifLight 36 hero (« Le carnet », « Le cercle », « Demandes ») at `maxFontSizeMultiplier={1.25}` per the role table.
- Capped the carnet Display note heroes in point/new (serifLight 72) and point/[id] (serifLight 80) at `maxFontSizeMultiplier={1.15}` so they never overflow at the iOS accessibility maximum.
- Verified the verify-only screens: point/new (`insets.bottom + 32`), point/[id] (`insets.bottom + 32`), map FAB (`insets.bottom + 80`) and empty-hint (`insets.bottom + 148`) were already insets-based — no change needed.

## Task Commits

Each task was committed atomically:

1. **Task 1: Home-indicator + Dynamic Type sweep on tabs list/social screens** - `ded8c6e` (fix)
2. **Task 2: Verify-and-cap on map/point screens + final consistency pass** - `2ad77d2` (fix)

**Plan metadata:** (this commit) `docs(05-04): complete IOS-04 finitions sweep plan`

## Files Created/Modified
- `app/(app)/(tabs)/point/list.tsx` - listContent paddingBottom → `insets.bottom + 64`; « Le carnet » hero cap 1.25
- `app/(app)/(tabs)/friends/index.tsx` - list paddingBottom → `insets.bottom + 64` (inline); « Le cercle » hero cap 1.25
- `app/(app)/(tabs)/friends/requests.tsx` - list paddingBottom → `insets.bottom + 64` (inline); « Demandes » hero cap 1.25
- `app/(app)/point/new.tsx` - carnet note hero (serifLight Display) cap 1.15; paddingBottom verified
- `app/(app)/point/[id].tsx` - carnet note hero (serifLight Display) cap 1.15; paddingBottom verified

## Decisions Made
- **`insets.bottom + 64` for list screens:** the prior literal 100 cleared the 83px opaque tab bar with breathing room. On a modern iPhone (`insets.bottom` ≈ 34) this yields ≈ 98 — equivalent clearance — while shrinking gracefully on home-indicator-less devices and growing on larger insets. 64 is canonical (4xl).
- **Per-instance `maxFontSizeMultiplier` over AppText routing:** the plan explicitly allowed the lower-risk option. Adding one prop to the existing raw Text hero avoids restructuring JSX/handlers and keeps the diff to a single attribute per hero.
- **map/index left unchanged:** verify-only; FAB and hint already insets-based; no raw serif hero in-file (header text is in the shared MapHeader primitive — out of scope).

## Deviations from Plan

None - plan executed exactly as written. Both tasks were surgical edits matching the audit tables; no auto-fix rules triggered, no architectural decisions, no blocking issues.

## Issues Encountered
None. The audit baseline matched the live code (paddingBottom 100 on the three list screens; verify-only screens already conformant). The documented out-of-scope direct-Supabase debt (`handleCancel` in requests.tsx, `loadFriends` in friends/index.tsx) was left untouched and not extended.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- **Phase 5 complete (4/4).** Milestone v1.0 (Refonte UI/UX iOS) is code-complete across all 22 requirements.
- Ready for the phase build (orchestrator) + device validation (TestFlight clair+dark): confirm no content under the home indicator on the 9 screens, Dynamic Type max without layout break on heroes, opaque tab bar unchanged.
- No blockers. tsc baseline held at 20 (0 new errors over the whole plan).

## Self-Check: PASSED
- Files modified verified present: point/list.tsx, friends/index.tsx, friends/requests.tsx, point/new.tsx, point/[id].tsx (all edited this session).
- Task commits verified in history: `ded8c6e` (Task 1), `2ad77d2` (Task 2).
- tsc: 20 errors (= baseline), 0 new.

---
*Phase: 05-auth-profil-finitions*
*Completed: 2026-06-02*

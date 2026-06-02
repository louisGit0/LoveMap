---
phase: 03-cr-ation-d-tail-de-point-sheets-natifs
plan: 04
subsystem: ui
tags: [react-native, expo-router, formSheet, usePreventRemove, keyboard, carnet, typography, date-segments, mapbox]

# Dependency graph
requires:
  - phase: 03-01
    provides: "(app) Stack + point/[id] declared as formSheet route (sheetAllowedDetents 0.92, grabber, gestureEnabled)"
provides:
  - "Reading-optimized 'page de carnet' detail screen (stamp mini-map → «La page» eyebrow → NOTE Display 80 → serif pull-quote → mono metadata table → contextual actions → destructive)"
  - "Floating back button removed — native swipe-down/grabber dismiss only (IOS-02)"
  - "Edit-mode JJ/MM/AAAA date segments replacing DatePickerModal — removes the #2125 freeze hazard with usePreventRemove and the react-native-paper-dates usage on this screen"
  - "Edit-mode D-04 dirty-guard via usePreventRemove → 'Abandonner ce moment ?'; KAV-wrapped edit form"
  - "Serif+mono typographic discipline (sizes {80,22,16,9}), D-12 internal radii, T.danger destructive recolor"
affects: [03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edit-mode dirty-guard: usePreventRemove(isEditDirty, cb) gated on `editing` + per-field deltas (note/comment/duration/date), freeze-free because date is now segments (no RN Modal)"
    - "Date-segment reuse: JJ/MM/AAAA mono inputs (dayStr/monthStr/yearStr) ported from point/new.tsx; happened_at parse unchanged"
    - "Detail carnet typography: 4 sizes {80,22,16,9}, 2 weight tiers (serif 300/400 + mono 400), no F.sans / F.serifMedium"
    - "T.danger reserved for the destructive 'Effacer cette page' trigger (rose T.primary reserved for affirmative actions)"

key-files:
  created: []
  modified:
    - "app/(app)/point/[id].tsx — sheet plumbing (back button removed, date-segment swap, KAV, edit dirty-guard) + reading-carnet redesign"

key-decisions:
  - "Edit dirty-guard date delta compares current segments against the original happened_at-derived strings (not against ''), since enterEditMode pre-fills the segments — avoids the guard being permanently dirty in edit mode"
  - "Edit-mode echo sizes (editNoteValue 48, editNoteDenom 14, editLineInput 20) retained as-is: the plan's locked {80,22,16,9} discipline governs the reading layout; the plan action did not enumerate edit-mode input sizes for change, so they were left untouched to avoid scope creep (rg assertions do not flag them)"
  - "consentBadgeText bumped 8→9 to keep every employed size inside the {80,22,16,9} Eyebrow role"
  - "miniMap given radiusMd+continuous per UI-SPEC Détail radii table even though it is the full-bleed top stamp"

patterns-established:
  - "Pattern: edit-mode dirty-guard (usePreventRemove gated on `editing`, freeze-free with date segments instead of DatePickerModal)"
  - "Pattern: detail carnet typographic scale {80,22,16,9} serif+mono only, T.danger destructive"

requirements-completed: [UI-04, IOS-02, IOS-01]

# Metrics
duration: 14min
completed: 2026-06-02
---

# Phase 3 Plan 04: Détail « page de carnet » Summary

**Reading-optimized detail sheet — stamp mini-map, NOTE serif-giant Display 80, italic «»-quoted pull-quote, mono metadata table, and serif+mono contextual actions — with the floating back button removed (native dismiss), the freeze-prone edit DatePickerModal swapped for JJ/MM/AAAA segments (#2125 fix), a KAV-wrapped edit form with a usePreventRemove dirty-guard, and the destructive trigger recolored T.danger; all business logic (consent seal/refuse, edit+save, delete) preserved (D-07).**

## Performance

- **Duration:** 14 min
- **Started:** 2026-06-02T09:02:00Z
- **Completed:** 2026-06-02T09:16:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Removed the floating `backBtn` `TouchableOpacity` (`IcoArrow dir="left"`) + its `T.bg+'cc'` style; closure is now the native swipe-down/grabber (IOS-02). `IcoArrow` import kept for the save-CTA arrow.
- Swapped the edit-mode `DatePickerModal` (+ `showDatePicker` state + `editDateBtn` + `react-native-paper-dates` import) for the JJ/MM/AAAA mono segment pattern (`dayStr`/`monthStr`/`yearStr`, ported from `point/new.tsx`); pre-filled in `enterEditMode`, parsed in `handleSaveAndAccept` — `happened_at` output unchanged. This removes the #2125 RN-Modal-vs-`usePreventRemove` freeze cause entirely.
- Wrapped the screen in `KeyboardAvoidingView` (`padding`, `keyboardVerticalOffset={0}`) + RN `ScrollView` (`keyboardShouldPersistTaps="handled"`, `contentContainerStyle` reserving `insets.bottom + 32`); dropped `insets.top` from the centered loading/empty states (sheet starts under the grabber).
- Added the edit-mode D-04 dirty-guard with `usePreventRemove(isEditDirty, …)` → native `Alert` "Abandonner ce moment ?"; `isEditDirty` is gated on `editing` and compares note/comment/duration/date deltas against the loaded point (date delta against the original `happened_at`-derived strings).
- Rebuilt the reading flow as a carnet: «La page» mono eyebrow → NOTE Display 80/76 serif giant + `/10` mono + read-only 10-segment bar → pull-quote (`«`/`»` + comment in `F.serif` italic Heading) → photos (unchanged) → mono/serif metadata table → consent/edit actions → destructive trigger.
- Enforced serif+mono discipline (removed all `F.sans*` and `F.serifMedium`): `consentEditText`→mono uppercase Eyebrow, `consentAcceptText`/`saveBtnLabel`→serif italic Heading 22, `quoteMark`→`F.serif` 400.
- Applied D-12 internal radii with `borderCurve:'continuous'`: `radiusMd` (mini-map, consent edit/accept, save button), `radiusSm` (photo thumb), `radiusXs` (consent badge); `markerDot` stays round.
- Recolored the destructive trigger to `T.danger` (`deleteBtnText` + `IcoTrash`), reserving `T.primary` for affirmative actions per UI-SPEC §Color.

## Task Commits

Each task was committed atomically:

1. **Task 1: Sheet plumbing — back button removed, date-segment swap, KAV, edit dirty-guard** - `644f41c` (feat)
2. **Task 2: Reading-carnet redesign (Display note, pull-quote, metadata, action typography, destructive recolor)** - `94431be` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `app/(app)/point/[id].tsx` - Reading-optimized carnet detail sheet: native dismiss (no back button), JJ/MM/AAAA edit-date segments (no DatePickerModal), KAV-wrapped edit form, usePreventRemove edit dirty-guard, serif+mono typography {80,22,16,9}, D-12 radii, T.danger destructive, locked FR copy. Business logic (`loadPoint`, `handleConsent`, `handleDelete`, `handleSaveAndAccept`, `enterEditMode`, all Supabase calls) unchanged.

## Decisions Made
- **Edit dirty-guard date delta** compares the current segments against `originalDay/Month/Year` derived from the loaded point's `happened_at`/`created_at`, not against `''`. Because `enterEditMode` pre-fills the segments, comparing against `''` would make the guard permanently dirty whenever editing; the delta comparison fires the Alert only on a real change.
- **Edit-mode echo sizes retained** (`editNoteValue 48`, `editNoteDenom 14`, `editLineInput 20`, `editDateText`-now-`dateSegment 20`): the locked `{80,22,16,9}` discipline in UI-SPEC §Typography Détail governs the *reading* layout; the Plan 04 action list does not enumerate edit-mode input sizes for change. Left untouched to avoid scope creep; rg/tsc assertions pass.
- **consentBadgeText 8→9** to keep every employed size within the four declared roles.
- **miniMap radiusMd+continuous** applied per the UI-SPEC Détail radii table (it is the top "tampon de lieu" container).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Edit dirty-guard date delta compared against empty strings**
- **Found during:** Task 1 (sheet plumbing — dirty-guard)
- **Issue:** A first pass compared `dayStr !== '' || monthStr !== '' || yearStr !== ''`. Since `enterEditMode` pre-fills the segments from the point's date, those are never empty in edit mode, which would make `isEditDirty` permanently true and pop "Abandonner ce moment ?" even when nothing changed.
- **Fix:** Compute `originalDay/originalMonth/originalYear` from the point's `happened_at`/`created_at` and compare the live segments against those, so the guard reflects an actual date change.
- **Files modified:** app/(app)/point/[id].tsx
- **Verification:** tsc 0 new errors; `usePreventRemove`/`dayStr` rg assertions match.
- **Committed in:** 644f41c (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (correctness of the dirty-guard).
**Impact on plan:** No scope change, no business-logic change. The fix makes the D-04 guard behave correctly in edit mode.

## Issues Encountered
- **ESLint not configured at repo root** (`eslint .` reports "couldn't find an eslint.config.(js|mjs|cjs)" under ESLint v9 — pre-existing project condition). The binding gate is `tsc --noEmit`, which is clean.
- **tsc baseline:** total error count held at the documented **38** baseline. The five `[id].tsx` errors are pre-existing Supabase `never`-typed raw-query results (`location`/`partner_id`/profile cast/`point_partners` update) — untouched, **0 new errors** introduced. `borderCurve:'continuous'` typed cleanly.

## Known Stubs
None. No hardcoded empty data, placeholders, or unwired components introduced. The consent/edit/delete paths and all Supabase reads/writes are preserved and wired to real state.

## Threat Flags
None new. Per the plan's threat register: T-03-08 (edit DatePickerModal + active dismiss-guard freeze, #2125) is now **mitigated** — the edit date is JJ/MM/AAAA segments (no RN Modal), so the guard runs without the freeze conflict. T-03-06 (consent/`is_visible` bypass), T-03-09 (other-user PII), T-03-02 (supply chain) remain **accept (unchanged)** — same RLS-guarded paths, no new query, zero new dependency (the swap *removes* `react-native-paper-dates` usage here).

## Device-Validated Items (deferred to Plan 05 gate)
- Native swipe-down/grabber dismiss returns to the map; clean (read) detail closes directly.
- Edit mode: changing a field then swiping down shows "Abandonner ce moment ?"; no freeze when the guard is active (date segments, no Modal).
- Edit-form keyboard keeps the Commentaire field and date segments visible above the keyboard inside the non-resizing sheet.
- Consent seal/refuse and delete confirmation (`Alert` destructive) behave as before.

## Next Phase Readiness
- 03-05 (device validation gate) can validate the native dismiss, edit flow (freeze-free), consent, and delete on device.
- Phase 3 remains JS-only (zero new dependency; this plan *removed* a screen-level dependency usage) → OTA-eligible, native-sheet/keyboard/dismiss behaviors device-gated in Plan 05.

## Self-Check: PASSED

- FOUND: `app/(app)/point/[id].tsx`
- FOUND: `.planning/phases/03-cr-ation-d-tail-de-point-sheets-natifs/03-04-SUMMARY.md`
- FOUND commit: `644f41c` (Task 1)
- FOUND commit: `94431be` (Task 2)

---
*Phase: 03-cr-ation-d-tail-de-point-sheets-natifs*
*Completed: 2026-06-02*

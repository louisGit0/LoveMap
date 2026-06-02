---
phase: 03-cr-ation-d-tail-de-point-sheets-natifs
plan: 03
subsystem: ui
tags: [react-native, expo-router, formSheet, usePreventRemove, keyboard, carnet, typography, mapbox]

# Dependency graph
requires:
  - phase: 03-01
    provides: "(app) Stack + (tabs) group + point/new declared as formSheet route (sheetAllowedDetents 0.92, grabber, gestureEnabled)"
provides:
  - "Note-first 'page de carnet' creation screen (NOTE serif-giant Display 72 hero + 10 tappable segments first)"
  - "Sheet-correct keyboard handling (KAV padding + RN ScrollView, keyboardVerticalOffset 0, paddingBottom insets.bottom+32)"
  - "D-04 dirty-dismiss guard via usePreventRemove → 'Abandonner ce moment ?' on swipe-down + tertiary link"
  - "Serif+mono typographic discipline (sizes {72,24,20,10}), D-12 internal radii (radiusXs/Sm/Md + borderCurve continuous)"
affects: [03-04, 03-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "usePreventRemove(isDirty, cb) dirty-guard wired to native swipe-dismiss (reused in 03-04 edit mode)"
    - "Keyboard-in-native-sheet: KAV (padding, offset 0) + RN ScrollView (persistTaps handled, contentContainerStyle bottom inset)"
    - "Carnet typography: 4 sizes {72,24,20,10}, 2 weight tiers (serif 300/400 + mono 400), no F.sans / F.serifMedium"

key-files:
  created: []
  modified:
    - "app/(app)/point/new.tsx — full note-first carnet redesign + sheet keyboard + D-04 guard"

key-decisions:
  - "Address-search error upgraded to recovery-path copy 'Adresse introuvable — modifiez votre recherche.' to honor UI-SPEC Copywriting Contract (deviation Rule 2)"
  - "Date segments brought to Body size 20 (from 32) to satisfy the locked 4-size {72,24,20,10} typography discipline (UI-SPEC §Typography Création)"
  - "Tap-backdrop dismiss bypass (react-native-screens #3568) ACCEPTED (Option A) — documented, no workaround code"

patterns-established:
  - "Pattern 1: native-sheet dirty-dismiss guard via usePreventRemove + native Alert (destructive)"
  - "Pattern 2: keyboard-in-sheet (KAV + RN ScrollView, never gorhom BottomSheet*)"
  - "Pattern 3: carnet typographic scale {72,24,20,10} serif+mono only"

requirements-completed: [UI-03, IOS-01]

# Metrics
duration: 12min
completed: 2026-06-02
---

# Phase 3 Plan 03: Création « page de carnet » Summary

**Note-first creation sheet — serif-giant Display 72 NOTE hero + 10 tappable segments leading the flow, sheet-correct KAV+ScrollView keyboard handling, and a usePreventRemove D-04 dirty-dismiss guard ('Abandonner ce moment ?'), all business logic (create_point RPC, mandatory partner, GPS, date) preserved.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-06-02T08:21:00Z
- **Completed:** 2026-06-02T08:33:13Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Reordered `point/new` to lead with the NOTE (serif-giant Display 72/68 value + `/10` mono + 10 tappable segments) as the page hero (D-10), followed by Commentaire → Partenaire → Durée → Date → Lieu → CTA → tertiary link.
- Wired sheet-correct keyboard handling: `KeyboardAvoidingView` (`padding`, `keyboardVerticalOffset={0}`) + RN `ScrollView` (`keyboardShouldPersistTaps="handled"`, `contentContainerStyle` reserving `insets.bottom + 32`); dropped `insets.top` (sheet starts under the native grabber).
- Implemented the D-04 dirty-dismiss guard with `usePreventRemove(isDirty, …)` → native `Alert` "Abandonner ce moment ?" on both the native swipe-down and the tertiary "Abandonner la saisie" link.
- Enforced the carnet typographic discipline: serif (300/400) + mono (400) only, sizes locked to `{72,24,20,10}`; removed the decorative `innerBorder` (no skeuomorphism, D-08); `partnerName` moved from `F.sans` to `F.serif`.
- Applied D-12 internal radii (`radiusMd` mini-map/CTA, `radiusSm` partner chip, `radiusXs` segments) with `borderCurve:'continuous'`; reserved `T.primary` to affirmative accents only.

## Task Commits

Each task was committed atomically:

1. **Task 1: Sheet plumbing — keyboard handling + D-04 dismiss-guard** - `77ba8bd` (feat)
2. **Task 2: Note-first carnet redesign (typography, radii, copy)** - `e08932d` (feat)

**Plan metadata:** _(this commit)_ (docs: complete plan)

## Files Created/Modified
- `app/(app)/point/new.tsx` - Note-first carnet creation sheet: NOTE hero first, serif+mono typography ({72,24,20,10}), D-12 radii, locked FR copy, KAV+ScrollView keyboard handling, usePreventRemove D-04 guard. Business logic (`handleSubmit`, `createPoint` RPC, mandatory partner, GPS validation, JJ/MM/AAAA date parse) unchanged.

## Decisions Made
- **Address-search error copy** upgraded from "Adresse introuvable." to the locked recovery-path form "Adresse introuvable — modifiez votre recherche." (UI-SPEC Copywriting Contract + critical-constraint "errors with recovery path").
- **Date segments** reduced from `fontSize 32` to Body `20` to comply with the locked 4-size discipline `{72,24,20,10}` (UI-SPEC §Typography Création; "reused as-is" interpreted as reusing the JJ/MM/AAAA mechanism, not the off-scale size).
- **Lieu eyebrow** added (`<Text style={styles.fieldEyebrow}>Lieu</Text>`) for section-label consistency with the other fields (section is named "Lieu" in UI-SPEC §Page Composition order 8).
- **Tap-backdrop dismiss bypass** (react-native-screens #3568): accepted as Option A per RESEARCH — at detent 0.92 the backdrop is a ~8% top strip; documented in-code and here, no workaround.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical / spec-alignment] Address-search error recovery-path copy**
- **Found during:** Task 2 (Note-first carnet redesign)
- **Issue:** Existing `handleSearch` error read "Adresse introuvable." with no recovery path; UI-SPEC Copywriting Contract locks "Adresse introuvable — modifiez votre recherche." and the executor critical-constraints require errors with a recovery path.
- **Fix:** Updated both `setSnackbar` calls in `handleSearch` to the locked recovery-path string.
- **Files modified:** app/(app)/point/new.tsx
- **Verification:** rg confirms the new copy; tsc clean (0 new errors).
- **Committed in:** e08932d (Task 2 commit)

**2. [Rule 2 - Spec compliance] Date segments to Body size 20**
- **Found during:** Task 2 (Note-first carnet redesign)
- **Issue:** `dateSegment` was `fontSize 32`, outside the locked 4-size set `{72,24,20,10}` mandated by UI-SPEC §Typography Création ("chaque taille employée … appartient à l'un des 4 rôles déclarés").
- **Fix:** Set `dateSegment` to Body `fontSize 20` (mono), preserving the JJ/MM/AAAA mechanism unchanged.
- **Files modified:** app/(app)/point/new.tsx
- **Verification:** No `32` size remains; the 4-size discipline holds; tsc clean.
- **Committed in:** e08932d (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both spec-alignment to the locked UI-SPEC contract).
**Impact on plan:** Both changes align the screen to the locked UI-SPEC (copy contract + typography discipline). No scope creep, no business-logic change.

## Issues Encountered
- **ESLint not configured at repo root** (`eslint .` finds no config — pre-existing). Substituted with `expo lint`, which reports only the pre-existing `react-hooks/exhaustive-deps` warning on the geolocation `useEffect` (intentional empty deps, unchanged). 0 new lint findings on `new.tsx`.
- **tsc baseline:** total error count held at the documented 38 baseline. The two `new.tsx` errors (MapState handler typing on `onCameraChanged`/`onMapIdle`) are pre-existing and untouched — 0 new errors introduced. `borderCurve:'continuous'` typed cleanly under RN 0.81.

## Known Stubs
None. No hardcoded empty data, placeholders, or unwired components introduced. All inputs bind to real state; `createPoint` RPC path preserved.

## Threat Flags
None. Trust boundary (client → `create_point` RPC) unchanged; same fields, same validation, same RLS/trigger. No new network/auth/file surface.

## Device-Validated Items (deferred to Plan 05 gate)
- Keyboard keeps the multiline Comment field visible above the keyboard inside the non-resizing sheet.
- Swipe-down with dirty input shows the "Abandonner ce moment ?" Alert; clean input closes directly.
- Tap-backdrop edge case (#3568): closes without confirmation — accepted, to verify rarity at detent 0.92.

## Next Phase Readiness
- 03-04 (détail carnet) can reuse the `usePreventRemove` dirty-guard pattern and the keyboard-in-sheet stack established here (conditioned on edit mode), and the JJ/MM/AAAA date-segment pattern.
- Phase 3 remains JS-only (zero new dependency) → OTA-eligible, but native-sheet/keyboard/dismiss behaviors are device-gated in Plan 05.

## Self-Check: PASSED

- FOUND: `app/(app)/point/new.tsx`
- FOUND: `.planning/phases/03-cr-ation-d-tail-de-point-sheets-natifs/03-03-SUMMARY.md`
- FOUND commit: `77ba8bd` (Task 1)
- FOUND commit: `e08932d` (Task 2)

---
*Phase: 03-cr-ation-d-tail-de-point-sheets-natifs*
*Completed: 2026-06-02*

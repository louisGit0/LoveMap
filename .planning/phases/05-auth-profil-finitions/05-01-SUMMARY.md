---
phase: 05-auth-profil-finitions
plan: 01
subsystem: ui-primitives
tags: [dynamic-type, typography, app-text, d-06, ios-04]
requires: []
provides:
  - "AppText `display` variant (F.serifLight, maxFontSizeMultiplier 1.15) — Cover 56 hero primitive"
affects:
  - "05-02 (login/register restyle — consumes variant=display)"
  - "05-03 (profile restyle — Cover 56 nom + grande tuile bento)"
  - "05-04 (IOS-04 sweep — Dynamic Type caps per role)"
tech-stack:
  added: []
  patterns:
    - "Per-role maxFontSizeMultiplier caps via a single thin AppText primitive (D-06 lever)"
key-files:
  created: []
  modified:
    - components/ui/AppText.tsx
decisions:
  - "display variant maps F.serifLight (300) and caps Dynamic Type at 1.15 — the tightest cap (hero unique, never overflows)"
  - "body cap NOT lowered globally (stays 2.0) — the 1.8 cover-field cap is applied per instance via the {...props} spread, not in the primitive"
metrics:
  duration: ~6 min
  completed: 2026-06-02
  tsc_baseline: 21
---

# Phase 5 Plan 01: AppText `display` variant + per-role Dynamic Type caps Summary

Extended the shared `AppText` Dynamic Type primitive with a 4th variant `display` (`F.serifLight`, cap 1.15) so the « page de couverture » Cover 56 heroes and the large bento tile in the auth/profile restyles route through a single capped primitive — the central D-06 lever and foundational dependency for 05-02/05-03/05-04.

## What Was Built

- **`Variant` union** now includes `'display'` alongside `body | title | eyebrow`.
- **`VARIANT_FONT.display = F.serifLight`** (CormorantGaramond_300Light_Italic — Cover 56 hero / grande tuile bento). No new import: `F.serifLight` was already exported from the `F` object.
- **`MAX_SCALE.display = 1.15`** — the tightest per-role cap; the hero is unique per screen and must never overflow at the iOS accessibility maximum (Pitfall 2).
- One-line French comment marks `display` as the Cover 56 hero variant.
- The component stays **thin**: variant → fontFamily + cap only. No fontSize/color/lineHeight introduced; size/color still come from the caller's `style` prop. `allowFontScaling`, `maxFontSizeMultiplier={MAX_SCALE[variant]}`, and the `{...props}` spread are intact, so a caller can still override the cap per instance (e.g. `maxFontSizeMultiplier={1.8}` on cover fields, `={1.25}` on a Title 32 serifLight).

## tsc Baseline (Phase 5 reference gate)

- **Pre-edit (Task 0): 21 errors** — matches the documented STATE.md baseline exactly (preexisting Supabase `never`-type debt, out of scope).
- **Post-edit (Task 1): 21 errors** → **0 new errors** introduced.
- **Use `21` as the « 0 new errors » reference for all Phase 5 plans (05-02/03/04).**

## Per-role Dynamic Type caps (UI-SPEC §Typography)

| Role | Family | Cap | AppText route |
|------|--------|-----|---------------|
| Cover / Display (56) | F.serifLight | **1.15** | `variant="display"` (new) |
| Title (32) | F.serifLight | 1.25 | `variant="title"` + `fontFamily: F.serifLight` + `maxFontSizeMultiplier={1.25}` |
| Heading / Body serif (20) | F.serif | 1.3 | `variant="title"` (already F.serif 400, cap 1.3) |
| Body fonctionnel (16) | F.sans | 1.8 | `variant="body"` + per-instance `maxFontSizeMultiplier={1.8}` on cover fields |
| Eyebrow (10) | F.mono | 1.2 | `variant="eyebrow"` (cap 1.2) |

Only the `display` row required a primitive change this plan; the others are achieved by existing variants + per-instance props.

## Deviations from Plan

None — plan executed exactly as written. Both tasks (Task 0 baseline capture, Task 1 additive variant) completed; existing `body`/`title`/`eyebrow` caps left byte-for-byte unchanged (2.0 / 1.3 / 1.2).

## Tasks & Commits

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 0 | Capture fresh tsc baseline | (measurement only) | — |
| 1 | Add `display` variant with per-role caps | 7b98072 | components/ui/AppText.tsx |

## Self-Check: PASSED

- `components/ui/AppText.tsx` exists and contains `display` in both `VARIANT_FONT` and `MAX_SCALE` — FOUND.
- Commit `7b98072` exists in git log — FOUND.
- tsc post-edit = 21 = baseline (0 new errors) — VERIFIED.

---
phase: 05-auth-profil-finitions
plan: 02
subsystem: auth-ui
tags: [ui-01, ios-04, cover, auth, login, register, min-age-fix, snackbar, dynamic-type]
requires:
  - "components/ui/AppText (variant display, F.serifLight cap 1.15 — 05-01)"
  - "components/ui/Input, components/ui/Button (D-10, unedited)"
  - "lib/haptics, constants/config (APP_CONFIG.MIN_AGE)"
provides:
  - "Login cover screen (UI-01/D-01): eyebrow + Cover 56 hero + visible fields + single coral CTA + Snackbar errors + insets.bottom padding"
  - "Register cover stepper (UI-01/D-02): solemn age cover step 1 + login-consistent step 2, working client age gate (D-11), « Vérifier mon âge » CTA (D-12)"
affects:
  - "app/(auth)/login.tsx"
  - "app/(auth)/register.tsx"
tech-stack:
  added: []
  patterns:
    - "AppText variant=display for Cover 56 hero (consumes 05-01 lever)"
    - "Per-instance cover radius (borderRadius T.radiusSm + borderCurve continuous) — Button.tsx untouched (D-10)"
    - "Paper Snackbar for auth errors (generic FR copy, no raw Supabase string — T-05-02-02 mitigation)"
    - "Input value override F.sans 16 + maxFontSizeMultiplier 1.8 per instance (cover fields)"
key-files:
  created: []
  modified:
    - "app/(auth)/login.tsx"
    - "app/(auth)/register.tsx"
decisions:
  - "Login/register heroes use AppText variant=display (56) — single cover hero per screen"
  - "Loading CTA uses disabled + label « Connexion… » (UI-SPEC §États réseau) rather than spinner, to honor copywriting contract without editing Button.tsx"
  - "Register step 2 hero copy chosen « Votre carnet » (editorial, ties to « Commencer le carnet » CTA; differentiated from list's « Le carnet »)"
  - "innerBorder frame removed on both screens for a clean, generous-whitespace cover"
metrics:
  duration: "~25 min"
  completed: 2026-06-02
  tasks: 2
  files: 2
  tsc_baseline: 21
  tsc_after: 20
---

# Phase 5 Plan 02: Auth « Page de couverture » Restyle (UI-01) Summary

Restyled `login.tsx` and `register.tsx` into the magazine-cover archetype (eyebrow mono + Cover 56 serif hero + immediately-visible underline fields + one rose CTA), fixed the latent client `MIN_AGE` gate (D-11), moved errors to Paper Snackbar, and tied bottom padding to `insets.bottom + 32` (IOS-04) — all auth handlers, the register 2-step stepper, the JJ/MM/AAAA picker, and the server age trigger preserved verbatim.

## What Was Built

### Task 1 — Login cover (D-01) · commit `91255a3`
- En-tête couverture: `AppText variant="eyebrow"` « LOVEMAP · ÉDITION INTIME » + `AppText variant="display"` « LoveMap » (fontSize 56, lineHeight 56, `numberOfLines={1}`).
- Underline E-MAIL / MOT DE PASSE fields immediately visible (no fold), each `style={{ fontFamily: F.sans, fontSize: 16 }}` + `maxFontSizeMultiplier={1.8}`.
- Single `Button variant="coral"` « Se connecter » with per-instance cover radius (`borderRadius: T.radiusSm`, `borderCurve: 'continuous'`), height 52, `onPress` → `haptics.tap()` then `handleLogin()`; loading state shows disabled CTA labelled « Connexion… ».
- Secondary mono-underline link « Créer un compte » → register; optional mono hem « ÉDITION N°01 · 2026 ».
- Errors via Paper `Snackbar` with generic copy « Connexion impossible. Vérifiez vos identifiants. » — no raw Supabase string (T-05-02-02).
- `paddingTop: insets.top + 48` (was +56) / `paddingBottom: insets.bottom + 32` (was literal 48). Light `KeyboardAvoidingView` keeps the CTA reachable.
- Preserved: `handleLogin` (signInWithPassword → `router.replace('/(app)/map')`), `handleForgot`, show/hide-password logic.

### Task 2 — Register cover stepper + MIN_AGE fix · commit `359cdb1`
- **D-11 bug fixed:** import changed from `{ MIN_AGE }` (undefined → inert gate) to `{ APP_CONFIG }`; age guard now reads `calcAge() < APP_CONFIG.MIN_AGE`. `config.ts` untouched (zero blast radius). Server trigger `handle_new_user` remains the authoritative gate (règle 10).
- Step 1 solemn cover: eyebrow « VÉRIFICATION D'ÂGE » + Cover 56 hero « Quel âge avez-vous ? » + help line « Vous devez avoir 18 ans ou plus pour entrer. » (F.sans 16); JJ/MM/AAAA `PickerCol` kept verbatim; `Button variant="coral"` CTA renamed « Continuer » → « Vérifier mon âge » (D-12). Refusal shows « Vous devez avoir 18 ans ou plus. » + `haptics.warn()`; submit fires `haptics.tap()`.
- Step 2 login-consistent cover: eyebrow « N° 003 — INSCRIPTION » + serif hero « Votre carnet » + the 5 mapped Inputs (F.sans 16, cap 1.8) + `Button variant="coral"` « Commencer le carnet » + « Retour » back link.
- Errors via Paper `Snackbar` « Inscription impossible. Réessayez. » (replaces raw `error.message` into the email field).
- `paddingTop: insets.top + 48` (step 2 was +56) / `paddingBottom: insets.bottom + 32` (was literal 48). `F.sansLight` step-1 subtitle dropped.
- Preserved: `step` state, `StepIndicator`, `PickerCol`, `calcAge`, `validate`, `handleRegister` → `signUp({…, data:{ date_of_birth }})`, back buttons.

## Verification

- `npx tsc --noEmit`: **20 errors** (baseline 21). The MIN_AGE fix removed one pre-existing TS2305; **0 new errors**, none in login.tsx/register.tsx.
- Diff review: auth handlers (signInWithPassword/signUp/calcAge/validate/stepper/picker) preserved; `config.ts` untouched; `Button.tsx`/`Input.tsx`/`AppText.tsx` untouched; no hardcoded hex/fontFamily introduced; no `SafeAreaView`; `useSafeAreaInsets()` used.
- Off-scale spacing reassigned to `{4,8,16,24,32,48,64}` (paddingHorizontal 36→24, gaps/margins normalized); preserved picker internals left verbatim.

## Threat Surface

T-05-02-01 (Elevation of Privilege — age guard): **mitigated** — client gate now blocks < 18 (defense-in-depth); server trigger unchanged.
T-05-02-02 (Information Disclosure — error rendering): **mitigated** — generic French Snackbar copy, no raw Supabase strings in UI.
No new network endpoints, auth paths, or schema changes introduced (presentation-only restyle).

## Deviations from Plan

None — plan executed as written. Two minor sanctioned interpretations: (1) loading CTA uses disabled + « Connexion… » label per UI-SPEC §États réseau rather than the Button spinner (avoids editing Button.tsx, D-10); (2) register step 2 hero copy chosen « Votre carnet » (not specified in the copywriting contract, which gives no step-2 hero text).

## Human Verification Needed (device, clair + dark)

- Login: cover renders (eyebrow + Cover 56 hero + visible fields + one rose CTA); sign in → map; bad password → Snackbar; nothing under the home indicator; max iOS text size does not overflow/truncate the hero.
- Register: step 1 solemn cover; a < 18 birthdate now blocks with refusal + warn haptic (MIN_AGE fix); a valid ≥ 18 date advances; step 2 matches login grammar and creates an account end-to-end; home indicator clear; Dynamic Type max intact.

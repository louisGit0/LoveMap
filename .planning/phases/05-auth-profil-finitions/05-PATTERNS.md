# Phase 5: Auth, Profil & Finitions - Pattern Map

**Mapped:** 2026-06-02
**Files analyzed:** 4 modified + IOS-04 sweep across 9 screens
**Analogs found:** 4 / 4 (every target has an in-repo analog; bento tile uses a composite analog)

> Pure presentation refonte (no new deps, no flow change). Every "create" here is actually a **rewrite of an existing file's presentation** — the strongest analog for each refonte screen is **the file itself** (logic/handlers to preserve verbatim) plus the Phase 3/4 carnet editorial-header pattern for the new « page de couverture » chrome. Concrete line refs below are the planner's copy-from targets.

---

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `components/ui/AppText.tsx` | utility / text primitive | transform | **itself** (current 3-variant build) | exact (self-extension) |
| `app/(auth)/login.tsx` | screen (route) | request-response (Supabase auth) | **itself** + `point/list.tsx` carnet header | exact (self) + role-match |
| `app/(auth)/register.tsx` | screen (route) | request-response (Supabase auth) | **itself** + `login.tsx` (step-2 grammar) | exact (self) + exact (sibling) |
| `app/(app)/(tabs)/profile/index.tsx` | screen (route) | CRUD + request-response | **itself** (avatar/handlers verbatim) + `point/[id].tsx` (big-number Display) + `point/list.tsx` (editorial header) | exact (self) + composite |
| Bento Analyse tiles (inline in `profile`) | component (inline) | transform (derived `useMemo`) | **no single analog** — composite (see below) | partial |
| IOS-04 sweep (6 other screens + bottom gaps) | cross-cutting | — | established insets/token pattern | n/a |

---

## Pattern Assignments

### `components/ui/AppText.tsx` (utility, transform) — ADD `display` variant (D-06)

**Analog:** itself. The component is the documented Dynamic Type lever; the `display` variant is a thin addition, **no new typographic source of truth** (the file's own header comment mandates this).

**Current full build** (`AppText.tsx:9-34`) — this IS the analog to extend:
```tsx
type Variant = 'body' | 'title' | 'eyebrow';                      // line 9

const VARIANT_FONT: Record<Variant, string> = {                   // lines 12-16
  body: F.sans, title: F.serif, eyebrow: F.mono,
};
const MAX_SCALE: Record<Variant, number> = {                      // lines 19-23
  body: 2.0, title: 1.3, eyebrow: 1.2,
};

export function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return (
    <Text
      allowFontScaling                                            // line 28
      maxFontSizeMultiplier={MAX_SCALE[variant]}                  // line 29
      style={[{ fontFamily: VARIANT_FONT[variant] }, style]}      // line 30
      {...props}
    />
  );
}
```

**Edit pattern (per UI-SPEC §Typography caps 1.15/1.25/1.3/1.8/1.2):**
- Add `'display'` to the `Variant` union (line 9).
- `VARIANT_FONT.display = F.serifLight` (Cover 56 hero + grande tuile bento).
- `MAX_SCALE.display = 1.15` (serif hero, must never overflow).
- **Do NOT lower `body` 2.0 globally** — apply the 1.8 cap *per instance* on cover fields (`maxFontSizeMultiplier={1.8}` passed through, the `{...props}` spread already forwards it).
- `F.serifLight` is already imported via `F` from `@/constants/fonts` — no new import.

**Caveat (Phase 4, still true):** `variant="title"` maps `F.serif` (400), NOT `F.serifLight` (300). For a 300-weight Title 32, pass `style={{ fontFamily: F.serifLight }}` + `maxFontSizeMultiplier={1.25}` at the call site, OR use the new `display` variant.

---

### `app/(auth)/login.tsx` (screen, request-response) — refonte « page de couverture »

**Analog:** itself (handlers/flow to preserve) + `app/(app)/(tabs)/point/list.tsx` carnet header (the editorial eyebrow+serif chrome to adopt).

**PRESERVE verbatim — auth wiring** (`login.tsx:31-45`):
```tsx
async function handleLogin() {                                              // line 31
  if (!email.trim() || !password) { setError('Champs requis manquants.'); return; }
  setLoading(true); setError(null);
  const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  setLoading(false);
  if (e) { setError(e.message); return; }
  router.replace('/(app)/map');                                            // line 38
}
async function handleForgot() { /* resetPasswordForEmail — lines 41-45 */ }
```

**Current chrome to REPLACE** (`login.tsx:52-58`) — wordmark `love♥map` + `IcoHeartDashed`, tagline « De retour, voyageur. ». UI-SPEC §Connexion wants: eyebrow mono « LOVEMAP · ÉDITION INTIME » + Cover 56 hero « LoveMap » + ourlet mono.

**Editorial-header analog to copy from — `point/list.tsx`:**
```tsx
// point/list.tsx:160-161  (eyebrow+serif title pattern to mirror — add the mono eyebrow above)
<View style={styles.header}>
  <Text style={styles.title}>Le carnet</Text>
// point/list.tsx:222-229  → the serif-hero style to base the Cover hero on (bump 36→56, route via AppText display)
title: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 36, lineHeight: 40,
         letterSpacing: -1, color: T.text, marginBottom: 16 },
```

**Field pattern (reuse `Input` as-is, override to F.sans + cap per UI-SPEC §Code Examples):**
```tsx
<Input label="E-MAIL" value={email} onChangeText={setEmail}
  keyboardType="email-address" autoCapitalize="none"
  style={{ fontFamily: F.sans, fontSize: 16 }}   // override Input's default F.serif 20 (Input.tsx:68-70)
  maxFontSizeMultiplier={1.8} />                  // forwarded to TextInput via {...props} (Input.tsx:36)
```
**Caveat:** `Input` forwards `maxFontSizeMultiplier` to the `TextInput` only; its internal `label`/`error` are raw `<Text>` without a cap (`Input.tsx:30,42`). Per research recommendation, leave the primitive untouched (mono 10px label scales safely).

**CTA — reuse `Button`** (already wired `variant="solid"` at `login.tsx:93`); add `haptics.tap()` on press and migrate inline `error` (`login.tsx:88`) → Snackbar (D-01). Per D-10, apply cover radius via instance `style={{ borderRadius: T.radiusSm, borderCurve: 'continuous' }}` — do NOT edit `Button.tsx`.

**IOS-04 on this file:** `paddingTop: insets.top + 56` (`line 48`) and `paddingBottom: 48` literal (`line 122`) → home-indicator gap. Replace with `insets.top + 48 (3xl)` / `insets.bottom + 32`.

---

### `app/(auth)/register.tsx` (screen, request-response) — restyle stepper + FIX MIN_AGE (D-11)

**Analog:** itself (stepper/signUp to preserve) + `login.tsx` (step-2 must match login's cover grammar).

**THE BUG TO FIX (D-11) — confirmed:**
```tsx
import { MIN_AGE } from '@/constants/config';   // register.tsx:18  ← resolves to undefined
...
if (calcAge() < MIN_AGE) {                       // register.tsx:101 ← `< undefined` === false, gate inert
```
`constants/config.ts` exports **only** `APP_CONFIG.MIN_AGE` (nested, `config.ts:1-2`) — there is **no bare `export const MIN_AGE`** (verified, whole file read). Fix: `import { APP_CONFIG } from '@/constants/config'` + `APP_CONFIG.MIN_AGE`, OR add `export const MIN_AGE = 18` to `config.ts`. Server trigger `handle_new_user` remains the authoritative gate (règle 10) — unchanged.

**PRESERVE verbatim — stepper + signup:**
- `step` state + `StepIndicator` (`register.tsx:78, 148-154`), `PickerCol` JJ/MM/AAAA (`register.tsx:25-68, 191-196`), `calcAge()`/`confirmAge()` (`register.tsx:91-107`), `validate()` (`register.tsx:116-125`), `handleRegister` → `signUp({…, data:{ date_of_birth }})` (`register.tsx:127-145`), back buttons (`register.tsx:163-170, 229-236`).

**Step 1 chrome to RESTYLE** (`register.tsx:176-217`): two-line serif title « Réservé / aux adultes. » (serif 64, `register.tsx:323-339`) + custom `enterBtn` CTA « Continuer » (`register.tsx:207-215`). UI-SPEC wants solemn cover: eyebrow « VÉRIFICATION D'ÂGE » + Cover 56 hero (route via AppText `display`) + reuse `Button` for CTA (rename per checker_flag → e.g. « Vérifier mon âge », D-12). Drop `F.sansLight` subtitle (`register.tsx:354`, off-discipline weight).

**Step 2 chrome to RESTYLE** (`register.tsx:241-275`): eyebrow « N° 003 — Inscription » + serif title 42 + 5 mapped `Input`s + Button « Créer mon journal » → align with login cover grammar; CTA copy « Commencer le carnet » (UI-SPEC §Copywriting). The `.map()` over field configs (`register.tsx:248-266`) is reusable as-is.

**IOS-04 on this file:** step1 `insets.top + 48` (`line 159`) ✓ already; step2 `insets.top + 56` (`line 225`); scroll `paddingBottom: 48` literal (`line 296`) → `insets.bottom + 32`.

---

### `app/(app)/(tabs)/profile/index.tsx` (screen, CRUD + request-response) — refonte cover + bento

**Analog:** itself (avatar/handlers/`useMemo`s — preserve) + `point/[id].tsx` (big-number Display tile) + `point/list.tsx` (editorial header).

**PRESERVE VERBATIM — avatar upload (rules 14/15/17, do-not-refactor — cause of crashes #8/#11/#13):**
`handlePickAvatar` at **`profile/index.tsx:116-178`**. Copy mot pour mot. Non-negotiable anchors:
```tsx
ImagePicker = require('expo-image-picker');                 // line 121 — require INSIDE the fn, never import *
result = await ImagePicker.launchImageLibraryAsync({…});    // line 129 — NO requestMediaLibraryPermissionsAsync()
FileSystem = require('expo-file-system/legacy');            // line 149 — /legacy (rule 17, SDK 54)
```
Avatar render block (`profile/index.tsx:278-289`): square 80px box (`avatarBox` l.510 `borderRadius:0`, exception D-12 maintained), initial serif italic rose (`avatarInitial` l.512), `IcoPlus` badge.

**PRESERVE — Analyse data source (no new calc, no new network):** the three screen-level `useMemo`s are the bento data:
- `noteDistribution` (`profile/index.tsx:89-95`) → tile D barres.
- `topMonths` (`profile/index.tsx:97-106`) → tile C.
- `totalMinutes` (`profile/index.tsx:108-111`) → tile B durée.
- `points.length` (already rendered as stat « Entrées » `profile/index.tsx:336`) → **tile A grande « PAGES DU CARNET »** (just re-present in Cover 56, D-04).

**PRESERVE — account handlers (documented règle-4 exceptions, keep wiring):** `handleChangeEmail` / `handleChangePassword` via `supabase.auth.updateUser` (`profile/index.tsx:201-224`); `handleDeleteAccount` via `supabase.functions.invoke('delete-account')` (`profile/index.tsx:235-256`). Toggle `IcoSun/IcoMoon` (`profile/index.tsx:327-329`, imported l.30).

**Big-number bento tile analog — `point/[id].tsx`:** the read-hero note Display is the closest existing « gros chiffre serif » in the repo:
```tsx
// point/[id].tsx:238-245  (eyebrow + big serif value + mono denom — exact bento-tile-A structure)
<Text style={styles.pageEyebrow}>La page</Text>
<View style={styles.noteBlock}>
  <Text style={styles.noteValue}>{point.note}</Text>   // serifLight Display hero
  <Text style={styles.noteDenom}>/10</Text>
</View>
// point/[id].tsx:677-688  — the serifLight Display style to scale up to 56 for the bento number
editNoteValue: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 48, lineHeight: 48, color: T.primary }
```
**Divergence per D-04/§Color:** the bento grand chiffre stays `T.text`, **not** rose (`point/[id]` uses `T.primary` for its note — do NOT copy the color; copy the serifLight scale only).

**Distribution bars analog — internal:** reuse the existing monochrome+rose bar pattern verbatim, it already matches D-04:
```tsx
// profile/index.tsx:547-548  — track surface2, fill primary (exactly the D-04 spec)
noteBarTrack: { flex: 1, flexDirection: 'row', height: 3, backgroundColor: T.surface2 },
noteBarFill: { height: 3, backgroundColor: T.primary },
```

**Editorial header analog:** same `point/list.tsx:160-161,222-229` carnet pattern (eyebrow « MOI » + name in Cover 56 via AppText `display`).

**REMOVE this phase (per decisions):**
- **D-09:** the duplicate `Switch` « Mode sombre » at `profile/index.tsx:416-419` (`switchRow`) — keep only the `IcoSun/IcoMoon` toggle (l.327-329); add `accessibilityLabel` + `haptics.select()` (checker_flag Visuals).
- **D-08:** the « EFFACER » typed-confirm field + `deleteConfirm` state (`profile/index.tsx:71, 235-236, 480-490`) — replace with Alert-only (`handleDeleteAccount` Alert at l.238-255 already exists; drop the field gate at l.236). Note: current code calls `haptics.warn()` on **success** (l.249) and `haptics.error()` on error (l.248) — per UI-SPEC, `haptics.warn()` should fire on **Alert open**, `haptics.error()` on failure; fix the placement during restyle.
- Replace custom `updateBtn`/`deleteBtn` (`profile/index.tsx:566-575`, both use off-discipline `F.sansMedium`) with `<Button variant="coral">` / `<Button variant="danger">`.

**IOS-04 on this file:** `dangerBlock paddingBottom: 60` literal (`line 480`) → `insets.bottom + 32`. No `insets.bottom` currently used for the scroll bottom.

---

## Shared Patterns

### Theme + makeStyles + insets (canonical, all 9 screens)
**Source:** every screen, e.g. `login.tsx:21-23`, `profile/index.tsx:38,42-43`.
**Apply to:** all 3 refonte screens + every sweep target.
```tsx
const insets = useSafeAreaInsets();
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
// top:    paddingTop: insets.top (+ 48 for solemn covers)
// bottom: paddingBottom: insets.bottom + 32   ← IOS-04 fix on login/register/profile
```

### Avatar dynamic-require (DO NOT REFACTOR)
**Source:** `profile/index.tsx:116-178`.
**Apply to:** profile only — copy verbatim, never convert to static import, never add `requestMediaLibraryPermissionsAsync()`, never drop `/legacy`.

### Editorial header (eyebrow mono + serif title)
**Source:** `point/list.tsx:160-161` (« Le carnet ») + `point/[id].tsx:239` (« La page » eyebrow). serifLight title style at `point/list.tsx:222-229`.
**Apply to:** login / register step1 / register step2 / profile cover heroes (scaled to Cover 56, routed via AppText `display`).

### Primitives — reuse, never fork
**Source:** `Button.tsx` (variants `solid`/`coral`/`ghost`/`danger`/`underline`, base `borderRadius:0` l.92), `Input.tsx` (underline, label mono l.49-56, value F.serif 20 l.63-72), `PressableScale`.
**Apply to:** all CTAs/fields/links. Per D-10 + research Pitfall 4: do **NOT** edit `Button.tsx`/`Input.tsx` (blast radius = 9 screens). Cover-specific radius/font via per-instance `style`.

### Haptics + delete wiring (keep)
**Source:** `lib/haptics` (`haptics.tap/select/success/warn/error`), `supabase.functions.invoke('delete-account')` (`profile/index.tsx:247`).
**Apply to:** CTA tap, toggle, account success/fail, delete Alert — per UI-SPEC §Motion.

---

## No Analog Found

| Item | Role | Data Flow | Reason / Fallback |
|------|------|-----------|-------------------|
| Bento Analyse **grid layout** (variable-size tiles A full / B-C half / D full) | component (inline) | transform | No bento grid exists in the repo (profile's current Analyse is a flat stacked-block list, `profile/index.tsx:367-403`). **Compose from:** existing `useMemo` data (source) + `point/[id]` big-number Display (tile A typo) + `profile` distribution bars (tile D, already compliant) + UI-SPEC §Profil B grid spec. Use `cardRadius 16` + `borderCurve:'continuous'` (D-12). |

---

## IOS-04 Sweep Sites (verified)

**Dynamic Type baseline:** `maxFontSizeMultiplier`/`allowFontScaling` exist in **zero** files under `app/` (verified grep) — only `AppText.tsx` has them. The 3 refonte screens route editorial text via `AppText`; the 6 others get targeted caps on heroes/large serif only (do NOT cap every `<Text>`).

### Home-indicator (`insets.bottom`) — fix vs. verify

| Screen | Site | Current | Action |
|--------|------|---------|--------|
| `app/(auth)/login.tsx` | `scroll` | `paddingBottom: 48` literal (l.122); `paddingTop: insets.top + 56` (l.48) | **FIX → `insets.bottom + 32`** + inline error→Snackbar (D-01) |
| `app/(auth)/register.tsx` | `scroll` | `paddingBottom: 48` literal (l.296); top +48 (l.159)/+56 (l.225) | **FIX → `insets.bottom + 32`** |
| `app/(app)/(tabs)/profile/index.tsx` | `dangerBlock` | `paddingBottom: 60` literal (l.480) | **FIX → `insets.bottom + 32`** (during refonte) |
| `app/(app)/(tabs)/point/list.tsx` | `listContent` | `paddingBottom: 100` magic (l.265) | Low-pri sweep (works; magic clears tab bar) |
| `app/(app)/(tabs)/friends/index.tsx` | `listContent` | `paddingBottom: 100` (l.392) | Low-pri sweep |
| `app/(app)/(tabs)/friends/requests.tsx` | `listContent` | `paddingBottom: 100` (l.339); top `insets.top + 16` (l.167) | Low-pri sweep |
| `app/(app)/point/new.tsx` | scroll | `paddingBottom: insets.bottom + 32` (l.192) ✓ | **VERIFY only** |
| `app/(app)/point/[id].tsx` | scroll | `paddingBottom: insets.bottom + 32` (l.222) ✓ | **VERIFY only** |
| `app/(app)/(tabs)/map/index.tsx` | FAB/hint | `insets.bottom + N` (per research) ✓ | **VERIFY only** |

### Off-discipline font weights {must be 300/400}

| File | Line | Usage | Action |
|------|------|-------|--------|
| `register.tsx` | 354 | `F.sansLight` (step-1 subtitle) | Replaced by step-1 refonte |
| `profile/index.tsx` | 567 | `F.sansMedium` (`updateBtnText`) | Replace `updateBtn` → `<Button variant="coral">` |
| `profile/index.tsx` | 575 | `F.sansMedium` (`deleteBtnText`) | Replace `deleteBtn` → `<Button variant="danger">` |
| `components/ui/Button.tsx` | 110 | `F.sansMedium` (`baseText`) | **OUT OF SCOPE** — shared primitive, do not touch |

### Off-scale spacing/typo (sweep `{4,8,16,24,32,48,64}` + `rowGap 12` exception)
- `login.tsx`: `paddingHorizontal 36` (l.120), `insets.top + 56` (l.48), `marginBottom 44` (l.135), `fontSize 48/17/13/14` (l.124-170), `marginVertical 20` (l.178), `gap 12` (l.177), `marginTop 40` (l.173). (Mostly overwritten by refonte.)
- `register.tsx`: `paddingHorizontal 36` (l.296), `fontSize 64/42` (l.325/486), `gap 14/10` (l.343/376), `marginLeft 38` (l.338), assorted `10/12/18/22`. (Overwritten by refonte.)
- `profile/index.tsx`: `fontSize 28/36/48/15/16/11`, `paddingTop 24` (l.505), `paddingVertical 20/14`, `gap 12`, `paddingBottom 60` (l.480). (Overwritten by refonte.)
- 6 non-refonte screens: only fix obvious `13/14/18/20` layout values **if encountered**; do not rewrite. `rowGap = 12` stays allowed.

### Already conforming (no action)
- **0 `SafeAreaView`** anywhere in `app/` (verified) — nothing to remove.
- All 9 screens use `useSafeAreaInsets()` + `insets.top` (verified).
- All screens use `makeStyles(T)` + `useMemo([T])` — test dark+light, no hardcoded hex/`fontFamily`.
- Do NOT extend the documented out-of-scope debt (direct Supabase calls in `requests.tsx`/`friends/index.tsx`).

---

## Metadata

**Analog search scope:** `app/(auth)/`, `app/(app)/(tabs)/{profile,point,friends,map}/`, `app/(app)/point/`, `components/ui/`, `constants/`, `lib/`.
**Files read in full:** `AppText.tsx`, `Input.tsx`, `Button.tsx`, `config.ts`, `profile/index.tsx`, `login.tsx`, `register.tsx`. **Targeted reads/greps:** `point/list.tsx`, `point/[id].tsx`, `friends/index.tsx`, `friends/requests.tsx`, `point/new.tsx`, app-wide `maxFontSizeMultiplier`.
**Pattern extraction date:** 2026-06-02

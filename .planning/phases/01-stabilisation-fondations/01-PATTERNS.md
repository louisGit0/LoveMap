# Phase 01: Stabilisation & Fondations - Pattern Map

**Mapped:** 2026-05-29
**Files analyzed:** 6 (2 new, 4 modified) + 4 wiring points
**Analogs found:** 6 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `lib/haptics.ts` (NEW) | utility (lib wrapper) | event-driven (fire-and-forget) | `lib/notifications.ts` + `lib/supabase.ts` | exact (lib module style) |
| `components/ui/AppText.tsx` (NEW) | component (UI primitive) | transform (variant → style props) | `components/ui/Button.tsx` + `PageHeader.tsx` | role-match |
| `app/_layout.tsx` (MODIFY) | provider (root layout) | request-response (render tree) | self (insert wrapper into existing return) | self |
| `app.json` (MODIFY) | config | n/a | self (edit `runtimeVersion` key) | self |
| `app/(app)/point/new.tsx` (MODIFY — IOS-03) | controller (screen) | request-response | self (`handleSubmit`) | self |
| `app/(app)/point/[id].tsx` (MODIFY — IOS-03) | controller (screen) | request-response / CRUD | self (`handleConsent`, `handleDelete`) | self |
| `app/(app)/profile/index.tsx` (MODIFY — IOS-03) | controller (screen) | CRUD | self (`handleDeleteAccount`) | self |
| `hooks/usePoints.ts` + `hooks/useFriends.ts` (error wiring — IOS-03) | hook | CRUD | self (error branches return `false`) | self |

---

## Pattern Assignments

### `lib/haptics.ts` (NEW — utility, fire-and-forget)

**Analogs:** `lib/notifications.ts` (lines 1-12), `lib/supabase.ts` (lines 1-3, 24).

**Module-style + import convention** — `lib/` modules import the native dep at top level and export named symbols. `expo-haptics` is **already a dependency** (`~15.0.8`) and is already imported directly in `point/new.tsx` line 17 (that direct import must be removed — see D-03).

`lib/notifications.ts` lines 1-3 (top-level native import):
```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
```

**Single exported object (the API-by-intention shape from research)** — research ARCHITECTURE.md §Haptics lines 211-224 prescribes exactly this helper; CONTEXT D-03 mandates an intention-based API (`tap`/`select`/`success`/`warn`/`error`) and **fire-and-forget (no `await`)**:
```typescript
// lib/haptics.ts — prescribed by ARCHITECTURE.md §Haptics + CONTEXT D-01/D-02/D-03
import * as Haptics from 'expo-haptics';

export const haptics = {
  select:  () => { Haptics.selectionAsync(); },
  tap:     () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
  press:   () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); },
  success: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); },
  warn:    () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); },
  error:   () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); },
};
```

> **Naming note for planner:** CONTEXT D-03 lists the intentions as `tap()`, `select()`, `success()`, `warn()`, `error()`. The research helper uses `warning`/`drop`/`heavy`. Reconcile to the CONTEXT names (`warn` not `warning`); `press` (impact medium) covers D-02's "action importante". Exact signatures are Claude's discretion (D-03 line 43).

**TypeScript strictness** — no `any`; do not `await` the calls (fire-and-forget swallows the promise). CLAUDE.md rule: no direct `expo-haptics` calls anywhere else after this exists.

**Error handling** — haptics are best-effort; the OS already suppresses them when the user disables haptics (ARCHITECTURE.md line 207). No try/catch needed; never let a haptic failure surface to the user.

---

### `components/ui/AppText.tsx` (NEW — component, transform)

**Analogs:** `components/ui/Button.tsx` (lines 1-36, 110), `components/ui/PageHeader.tsx` (lines 1-19), `constants/fonts.ts` (lines 6-21).

**Imports + prop typing pattern** (from `Button.tsx` lines 1-24):
```typescript
import React, { useMemo } from 'react';
import { Text, StyleSheet, ... } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';

type Variant = 'solid' | 'coral' | 'ghost' | 'danger' | 'underline'; // Button's variant union
interface Props { ... variant?: Variant; }
```
Use a string-literal union for `variant` and an `interface Props` (matches Button.tsx lines 14-24). Do NOT use `React.FC`.

**`F` token shape that AppText must map to** (`constants/fonts.ts` lines 6-21) — AppText variants must reference these, no new typographic source of truth (D-06):
```typescript
export const F = {
  serif: 'CormorantGaramond_400Regular_Italic',
  serifLight: 'CormorantGaramond_300Light_Italic',
  serifMedium: 'CormorantGaramond_500Medium_Italic',
  sans: 'InterTight_400Regular',
  sansLight: 'InterTight_300Light',
  sansMedium: 'InterTight_500Medium',
  sansSemi: 'InterTight_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;
```

**Per-variant `maxFontSizeMultiplier` (D-04 bounds)** — research ARCHITECTURE.md lines 266-279 gives the AppText skeleton; CONTEXT D-04 fixes the bounds: corps ~2.0, titres serif (Cormorant) ~1.3, eyebrows/mono (JetBrains) ~1.2. `allowFontScaling` stays `true`:
```typescript
type Variant = 'body' | 'title' | 'eyebrow'; // align to fonts/usage, not Button's union
const MAX_SCALE: Record<Variant, number> = {
  body: 2.0,    // D-04: accessibilité large
  title: 1.3,   // D-04: protège la typo serif éditoriale
  eyebrow: 1.2, // D-04: mono/eyebrows
};
export function AppText({ variant = 'body', ...props }: TextProps & { variant?: Variant }) {
  return <Text allowFontScaling maxFontSizeMultiplier={MAX_SCALE[variant]} {...props} />;
}
```

> **Theme pattern decision:** `Button.tsx`/`PageHeader.tsx` use `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` (Button lines 35-36). AppText maps `variant → fontFamily (F.xxx) + maxFontSizeMultiplier` and forwards `style`/`children`; it does NOT own color tokens. The planner should keep AppText thin: variant drives `fontFamily` + scale bound; callers pass color via `style`. The exact variant set / file structure is Claude's discretion (D-04, CONTEXT line 43). Migration is progressive — existing raw `<Text>` are NOT mass-migrated in Phase 1 (D-05).

---

### `app/_layout.tsx` (MODIFY — provider, root wrapper)

**Analog:** self. Research PITFALLS.md §Reanimated/Gestures piège 2 (lines 126-130) + ARCHITECTURE.md lines 158-171 prescribe a single root `GestureHandlerRootView` above `PaperProvider`.

**Current root return block** (`app/_layout.tsx` lines 105-110) — this is the exact nesting target:
```tsx
  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
```

**Target shape** — wrap the existing tree with `GestureHandlerRootView style={{ flex: 1 }}` as the outermost element:
```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// ...
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={paperTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </PaperProvider>
    </GestureHandlerRootView>
  );
```

> **Notes for planner:**
> - The early `!fontsLoaded` return (lines 97-103) does NOT need the wrapper (no gestures during font load) — only the main return block.
> - `SafeAreaProvider` is auto-injected by Expo Router — do NOT add it (ARCHITECTURE.md line 236).
> - This is a **native** change → requires a new EAS build (#17), not OTA (PITFALLS.md §Redesign-Wide piège 6, CLAUDE.md rule on OTA). Must be sequenced AFTER STAB-01/02/03 validation (D-07).
> - Do NOT edit `babel.config.js` — worklets plugin is handled by `babel-preset-expo` (D-09 discretion + PITFALLS.md lines 118-123). Install via `npx expo install react-native-reanimated react-native-gesture-handler`.

---

### `app.json` (MODIFY — config, runtimeVersion)

**Analog:** self. PITFALLS.md §Redesign-Wide piège 1 (lines 148-154) marks the static `runtimeVersion` as the CRITICAL trap; CONTEXT D-10 mandates `policy: "fingerprint"` BEFORE build #17.

**Current value** (`app.json` line 80, inside the `expo` block):
```json
    "owner": "expomannnnn",
    "runtimeVersion": "1.0.0",
    "updates": {
      "url": "https://u.expo.dev/4a840651-f42d-499a-a705-4b5a4109d804"
    }
```

**Target edit** — replace the string with the fingerprint policy object:
```json
    "runtimeVersion": { "policy": "fingerprint" },
```

> **Single-key edit.** Do not touch other `expo` keys. After this, every native change auto-rotates the runtime so OTA can't land on an incompatible binary. This must be set before the #17 build that introduces reanimated/gesture-handler (D-10).

---

## Haptic Wiring Points (IOS-03)

All call sites below import `{ haptics }` from `lib/haptics.ts` and replace/augment existing snackbar+error flows. Mapping from CONTEXT D-02 / `<specifics>` table.

### Sceller un point → `haptics.success()` — `app/(app)/point/new.tsx`

**Handler:** `handleSubmit` (lines 118-168). The screen **already imports `expo-haptics` directly** (line 17) and **already awaits** it on success (line 166) — both violate D-03 (no direct import, no blocking `await`).

Current success branch (lines 165-167):
```typescript
    setSubmitting(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // REPLACE
    router.replace('/(app)/map');
```
Target: remove the `import * as Haptics` (line 17), replace line 166 with `haptics.success();` (no `await`).

Additional wiring in same handler (warn on validation failure, per `<specifics>` "partenaire manquant"):
- Line 121 (`Vous devez taguer un partenaire…`) → add `haptics.warn();`
- Line 127 (`Position GPS manquante…`) → add `haptics.warn();`
- Lines 152-156 catch block (`Erreur : ' + msg`) → add `haptics.error();`

### Consentement partenaire → success/warning — `app/(app)/point/[id].tsx`

**Handler:** `handleConsent(accept: boolean)` (lines 139-148). Current success/error structure:
```typescript
  async function handleConsent(accept: boolean) {
    if (!partnerRecord) return;
    const { error } = await supabase.from('point_partners').update({
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString(),
    }).eq('id', partnerRecord.id);
    if (error) { setSnackbar('Erreur lors de la réponse.'); return; }  // → haptics.error()
    setSnackbar(accept ? 'Page scellée.' : 'Taguage refusé.');         // → accept ? haptics.success() : haptics.warn()
    await loadPoint();
  }
```
Wiring (D-02): on `error` branch (line 145) → `haptics.error()`; on the success line 146 → `accept ? haptics.success() : haptics.warn()`. Note `handleSaveAndAccept` (lines 124-137) calls `handleConsent(true)`, so success haptic flows through automatically.

### Supprimer un point → `haptics.warn()` — `app/(app)/point/[id].tsx`

**Handler:** `handleDelete` (lines 99-113), `Alert.alert` destructive confirm:
```typescript
        onPress: async () => {
          const ok = await deletePoint(point.id);
          if (ok) router.replace('/(app)/map');           // → haptics.warn() (acte irréversible)
          else setSnackbar('Erreur lors de la suppression.'); // → haptics.error()
        },
```
Wiring (D-02 "suppression point ou compte → notification warning"): on `ok` (line 108) → `haptics.warn()`; on the else (line 109) → `haptics.error()`.

### Supprimer le compte → `haptics.warn()` — `app/(app)/profile/index.tsx`

**Handler:** `handleDeleteAccount` (lines 231-251), same `Alert.alert` destructive pattern:
```typescript
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account', { body: { userId: user.id } });
            if (error) { setSnackbar('Erreur lors de la suppression.'); return; } // → haptics.error()
            reset();
            router.replace('/(auth)/login');                                       // → haptics.warn()
          },
```
Wiring: on the `error` branch (line 244) → `haptics.error()`; after `reset()` / before redirect (line 245-246) → `haptics.warn()`.

> Profile also has many `setSnackbar('Erreur : …')` paths (avatar lines 122/135/147/162/170, saveDisplayName 185/190, email 198/202, password 210/211/215). These are lower priority (D-02 line 25: network errors "priorité moindre"). The planner may add `haptics.error()` to these `setSnackbar('Erreur…')` branches, but Phase 1's mandated set is sceller / consentement / suppression (D-02). Keep error-haptic wiring scoped.

### Network/RPC errors → `haptics.error()` — hooks (lower priority)

`hooks/usePoints.ts` and `hooks/useFriends.ts` use a consistent error convention: log + `return false` (e.g. `usePoints.ts` lines 26-29, 197-200, 245-248; `useFriends.ts` lines 21-24, 40-43, 56-59, 69-72). `createPoint` instead **throws** with the real Supabase message (usePoints lines 80-83, 102-104, 114-122) which the screen catches at `point/new.tsx` lines 152-156.

> **Recommendation:** do NOT call `haptics.error()` inside the hooks (keeps hooks side-effect-pure re: UI feedback, consistent with CLAUDE.md "pas de logique UI dans les hooks"). Fire `haptics.error()` at the **screen** level where the `false`/throw is surfaced via `setSnackbar` — colocated with the existing user-facing error (same place the snackbar appears). The hooks' `return false` / `throw` contract is the signal; the screen is the wiring site.

---

## Shared Patterns

### Theme + memoized styles (applies to AppText)
**Source:** `components/ui/Button.tsx` lines 35-36, `PageHeader.tsx` lines 18-19
```typescript
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
```
Every UI component follows this; `makeStyles(T)` lives at file bottom (`Button.tsx` line 87). AppText is thinner (variant→font mapping) but must not hardcode colors/fonts — consume `F.xxx` and accept color via `style`.

### Snackbar error feedback (applies to all haptic wiring screens)
**Source:** `point/new.tsx` lines 382-384, `point/[id].tsx` lines 371-373, `profile/index.tsx` lines 489
```tsx
<Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
  {snackbar}
</Snackbar>
```
Pattern: `const [snackbar, setSnackbar] = useState<string | null>(null)` + `setSnackbar('…')` on every error path. Haptic calls colocate with these `setSnackbar` calls (error → `haptics.error()`, validation → `haptics.warn()`). CLAUDE.md rule 3: errors must reach the user via Snackbar, not only console.

### Native-change delivery contract (applies to _layout.tsx, app.json, dep install)
**Source:** CLAUDE.md workflow + PITFALLS.md §Redesign-Wide pièges 1 & 6
- Reanimated/gesture-handler/`GestureHandlerRootView`/`runtimeVersion` are native → **new EAS build #17 required**, OTA inoperative.
- Sequence (D-07): validate STAB-01/02/03 on current TestFlight (#15/#16) FIRST, then produce #17 with the native foundations.
- `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` EAS secret must exist before any Mapbox-touching build (PITFALLS.md line 186) — unchanged here but relevant to #17.

---

## No Analog Found

None. Every Phase 1 file maps to an existing `lib/` module, `components/ui/` component, the root layout, the config file, or an existing handler in the screens/hooks. `react-native-gesture-handler` / `react-native-reanimated` are new *dependencies* but the integration point (`GestureHandlerRootView` in `app/_layout.tsx`) is an existing-file modification, not a new analog-less file.

## Metadata

**Analog search scope:** `lib/`, `components/ui/`, `constants/`, `app/`, `app/(app)/point/`, `app/(app)/profile/`, `hooks/`, `app.json`
**Files scanned:** 13
**Pattern extraction date:** 2026-05-29
</content>
</invoke>

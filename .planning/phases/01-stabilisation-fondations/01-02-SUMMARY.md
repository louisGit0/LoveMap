---
phase: 01-stabilisation-fondations
plan: 02
status: complete
requirements: [FOND-03, FOND-04]
---

# Summary 01-02 — Primitives JS (haptics + AppText)

## Objective atteint

Création des deux primitives JS de la refonte sans aucune application en masse : le helper haptique centralisé `lib/haptics.ts` (FOND-03) et le composant `AppText` qui borne le Dynamic Type (FOND-04).

## Ce qui a été construit

- **`lib/haptics.ts`** — objet `haptics` exposant l'API par intention réconciliée aux noms CONTEXT D-03 : `select`, `tap`, `press`, `success`, `warn`, `error`. Import top-level `import * as Haptics from 'expo-haptics'`. Chaque méthode est fire-and-forget (aucun `await`, aucun `return` de promesse). Aucune clé `warning`/`drop`/`heavy` (noms research écartés). Pas de try/catch (l'OS coupe déjà les haptiques si désactivés).
- **`components/ui/AppText.tsx`** — composant mince `AppText` typé `TextProps & { variant?: Variant }` (pas de `React.FC`). 3 variants : `body`/`title`/`eyebrow`. Mapping `VARIANT_FONT` vers `F.sans`/`F.serif`/`F.mono` (source unique `@/constants/fonts`, D-06). Bornes `MAX_SCALE` D-04 : body 2.0, title 1.3, eyebrow 1.2. `allowFontScaling` toujours true ; `maxFontSizeMultiplier` dépend du variant. Couleur passée par l'appelant via `style`. Aucun `<Text>` existant migré (D-05).

## Fichiers créés

- `lib/haptics.ts`
- `components/ui/AppText.tsx`

## Vérification

- Clés haptics confirmées (select/tap/press/success/warn/error) ; aucun `warning|drop|heavy` ; aucun `await` dans le fichier.
- AppText : `allowFontScaling`, `maxFontSizeMultiplier`, import `@/constants/fonts` confirmés ; aucune fontFamily littérale hardcodée.

## Déviation notable (à connaître)

Le critère d'acceptance demandait `npx tsc --noEmit` sans erreur sur le projet. **Le baseline du projet contient déjà ~40 erreurs TypeScript préexistantes** (types Supabase `never`, `MIN_AGE` absent de `@/constants/config`, typings Mapbox/expo-file-system, et même une erreur dans `node_modules/expo/tsconfig.base.json`). Ces erreurs sont antérieures à ce plan. Vérification effectuée : `npx tsc --noEmit` ne rapporte **aucune** erreur attribuable à `lib/haptics.ts` ni `components/ui/AppText.tsx`. Mes fichiers compilent proprement ; je n'introduis aucune erreur nouvelle. La dette tsc préexistante dépasse le périmètre de la Phase 1.

## Self-Check: PASSED

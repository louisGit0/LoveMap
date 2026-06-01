---
phase: 02-carte-stylis-e
plan: 01
status: complete
requirements: [UI-02]
---

# Summary 02-01 — Pivot design D-12 (tokens de rayon + CLAUDE.md)

## Objective atteint

Verrouillage du langage de formes iOS arrondies (D-12) au niveau du design system, consommé par 02-03 (FAB) et 02-04 (bandeau).

## Modifications

- **`constants/theme.ts`** : type `Theme` étendu de `radiusXs/Sm/Md/Lg/Xl` + `fab`. `darkTheme` et `lightTheme` reçoivent les valeurs identiques `radiusXs:8, radiusSm:12, radiusMd:16, radiusLg:22, radiusXl:28, fab:18`. `cardRadius` 4→16, `pill` 4→999. `borderCurve` NON ajouté (per-style prop, pas un token — RESEARCH Unknown #3). Couleurs inchangées. Export `T = darkTheme` conservé.
- **`CLAUDE.md` §Identité visuelle** : table de tokens révisée (cardRadius 16, pill 999, radiusXs..Xl, fab 18) ; nouvelle convention « Formes (D-12) » — coins iOS arrondis + `borderCurve:'continuous'` sur tout `borderRadius ≥ radiusSm`, FAB squircle. « Avatars carrés » et « Inputs underline only » explicitement PRÉSERVÉS (réévaluation Phases 5/3). Ligne Phase 2 ajoutée à la table des phases.

## Vérification

- `radiusXl: 28` ×2 (dark+light) ; `cardRadius: 16` ×2 ; `pill: 999` ×2 ; aucune ancienne valeur 4 ; aucun `borderCurve` dans theme.ts.
- CLAUDE.md : `borderCurve`/`squircle`/`radiusLg` présents ; `Avatars : carrés` + `underline only` toujours présents.
- `npx tsc --noEmit` : 38 erreurs baseline inchangées (0 nouvelle).

## Self-Check: PASSED

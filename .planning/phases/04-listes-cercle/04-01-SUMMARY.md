---
phase: 04-listes-cercle
plan: 01
subsystem: ui-liste-moments
tags: [UI-05, point-list, table-des-matieres, filtres-inline, sticky-sections]
requires: [usePoints, groupByMonth, lib/haptics, PressableScale, SkeletonRow]
provides: ["point/list archetype table-des-matieres", "filtres inline en pills", "PointListItem note Display 44 T.text"]
affects: ["app/(app)/(tabs)/point/list.tsx", "components/point/PointListItem.tsx"]
tech-stack:
  added: []
  patterns: ["FilterPill inline (T.pill + borderCurve continuous)", "SectionList sticky par mois", "etat filtre 2 champs minNote+sort"]
key-files:
  created: []
  modified:
    - "components/point/PointListItem.tsx"
    - "app/(app)/(tabs)/point/list.tsx"
  deleted:
    - "components/point/FiltersBottomSheet.tsx"
decisions:
  - "D-01 : note /10 rendue en F.serifLight Display 44 en T.text (PAS rose) — depart delibere de l'implementation rose 36"
  - "D-02 : SectionList groupee par mois, headers eyebrow mono sticky (stickySectionHeadersEnabled=true + backgroundColor T.bg)"
  - "D-03 : filtres inline en pills (minNote 0/5/7/9, sort date/note) remplacant FiltersBottomSheet"
  - "D-10 : FiltersBottomSheet.tsx supprime, FilterSort inline en type GroupSort local dans list.tsx"
metrics:
  duration: "~20 min"
  completed: 2026-06-02
  tasks: 3
  files_changed: 3
  tsc_baseline: 36
  tsc_after: 21
---

# Phase 4 Plan 01 : Liste des moments « table des matières » (UI-05) Summary

Refonte de l'écran `point/list` selon l'archétype « table des matières » : note /10 en ancre serif Display 44 en `T.text` (plus rose, plus de N°00X), groupement par mois à headers mono sticky, filtres inline en pills remplaçant `FiltersBottomSheet` (supprimé).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Baseline tsc + confirmation suppression FiltersBottomSheet | (mesure, pas de commit) | — |
| 2 | Refonte PointListItem — ligne table des matières | `ca79b7d` | components/point/PointListItem.tsx |
| 3 | Refonte list.tsx (pills inline + sticky + « Le carnet ») + suppression FiltersBottomSheet | `bb2ac4e` | app/(app)/(tabs)/point/list.tsx, components/point/PointListItem.tsx, components/point/FiltersBottomSheet.tsx (deleted) |

## What Was Built

**PointListItem.tsx**
- Note transformée en ancre Display : `F.serifLight` italic, `fontSize 44`, `lineHeight 44`, `color: T.text` (départ délibéré du rose — UI-SPEC §Color), ancre de largeur fixe 64 centrée.
- Dénominateur « /10 » en `F.mono` `fontSize 10` `T.textFaint`, discret sous le chiffre.
- `N°00X` et son style `number` supprimés (D-01) ; prop `index` retirée de l'interface.
- Commentaire serif italic passé de 17 → 20 (Heading) ; fallback « Sans commentaire » en `T.textFaint`.
- Chevron `›` passé de `F.sansLight` → `F.mono` `T.textFaint`.
- Spacing normalisé : `gap 14 → 12` (rowGap), `paddingVertical 16` (lg).
- Aucune occurrence de `F.sans*` / `F.serifMedium` ; pattern thème `useTheme()` + `makeStyles(T)` inchangé.

**list.tsx**
- Titre « Vos moments » → « Le carnet » (Title 36 `F.serifLight` italic).
- État de filtre inline 2 champs : `minNote: 0|5|7|9` + `sort: 'date'|'note'` ; `sections` via `useMemo([points, minNote, sort])` = `points.filter(p => p.note >= minNote)` puis `groupByMonth(filtered, sort === 'note' ? 'note_desc' : 'date_desc')`. `groupByMonth` conservé verbatim.
- Composant local `FilterPill` : conteneur `borderRadius: T.pill` + `borderCurve: 'continuous'`, `paddingHorizontal 12`, hauteur 44 ; ACTIVE = fond `T.primary` + label mono `T.text` ; INACTIVE = transparent + `borderWidth 1` `T.border` + label `T.textDim` ; tap → `haptics.select()`.
- Pills note-min « Toutes / 5+ / 7+ / 9+ » (0/5/7/9) + pills tri « Date / Note » dans `ListHeaderComponent` (scrollent).
- Headers de mois sticky : `stickySectionHeadersEnabled={true}` + `backgroundColor: T.bg` ajouté au header pour éviter le bleed sous le sticky.
- Supprimés : rangée de stats « Entrées / Moy. », bouton de filtre `TouchableOpacity`, `<FiltersBottomSheet>`, imports `FiltersBottomSheet`/`DEFAULT_FILTERS`/`countActiveFilters`/`FiltersState`/`FilterSort`/`IcoFilter`. `FilterSort` inliné en type local `GroupSort`.
- Empty state : « Le carnet est vide. » + « Posez votre premier moment sur la carte. ».
- Snackbar erreur réseau : « Impossible de charger les moments. Réessayez. ». D-04 préservé : `RefreshControl` pull-to-refresh, `SkeletonRow` au chargement, `Snackbar`.

**FiltersBottomSheet.tsx** : supprimé (D-10), orphelin confirmé (Task 1).

## tsc Baseline (référence phase 04 — plans 02/03)

- **Baseline = 36 erreurs** (`npx tsc --noEmit | grep -c "error TS"`). Gate = 0 nouvelle erreur sur 36.
- Après ce plan : **21 erreurs** (la suppression de `FiltersBottomSheet.tsx` a retiré des erreurs préexistantes contenues dans ce fichier — aucune des erreurs restantes ne touche `list.tsx` ni `PointListItem.tsx`).
- Note pour 04-02 / 04-03 : la baseline de référence reste **36** (l'écart vient d'une suppression de fichier, pas d'une correction de la dette existante).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Coordination de la prop `index` entre Task 2 et Task 3**
- **Found during:** Task 2
- **Issue:** Retirer `index` de l'interface `PointListItem` en Task 2 cassait `list.tsx` (qui passait encore `index`) → 37 erreurs (1 nouvelle) avant le commit Task 2.
- **Fix:** `index` conservée transitoirement comme prop optionnelle `@deprecated` pour le commit Task 2 (baseline 36 maintenue), puis retirée définitivement en Task 3 en même temps que la suppression du pass-through dans `list.tsx`. Le plan autorisait explicitement cette coordination.
- **Files modified:** components/point/PointListItem.tsx
- **Commits:** ca79b7d (Task 2), bb2ac4e (Task 3)

## Threat Flags

Aucun. Plan de présentation pure : aucune nouvelle requête Supabase, aucun nouveau champ exposé, aucune écriture. `usePoints.fetchMyPoints` inchangé (RLS existante sur `points`). Zéro nouvelle dépendance.

## Acceptance Criteria

- [x] Note `F.serifLight` 44 `T.text` (assertion source PointListItem)
- [x] Aucune occurrence de `N°` ni style `number`
- [x] Dénominateur « /10 » en `F.mono` / `T.textFaint`
- [x] `arrow` en `F.mono` (plus `F.sansLight`)
- [x] container `gap: 12`, `paddingVertical: 16`
- [x] Aucune occurrence `F.sans*` / `F.serifMedium` dans les fichiers touchés
- [x] list.tsx n'importe plus FiltersBottomSheet/DEFAULT_FILTERS/countActiveFilters/FiltersState/FilterSort/IcoFilter
- [x] État filtre = `minNote` + `sort` ; `sections` via groupByMonth
- [x] `stickySectionHeadersEnabled` = true
- [x] Titre « Le carnet » en `F.serifLight`
- [x] Aucune rangée stats ; FilterPill `T.pill` + borderCurve continuous, active = `T.primary`
- [x] components/point/FiltersBottomSheet.tsx N'EXISTE PLUS
- [x] Copie exacte UI-SPEC
- [x] 0 nouvelle erreur tsc (21 ≤ 36)

## Verification manuelle restante (device, hors exécution)

TestFlight dark + light : titre « Le carnet » ; pills inline (« 9+ » → notes ≥ 9 ; « Note » → tri par note desc dans le mois) ; headers de mois collants au scroll ; pull-to-refresh + skeleton + snackbar erreur ; aucune ouverture de sheet de filtre ; note grande en `T.text` (blanc dark / noir light, pas rose).

## Self-Check: PASSED
- components/point/PointListItem.tsx : présent, modifié (ca79b7d)
- app/(app)/(tabs)/point/list.tsx : présent, modifié (bb2ac4e)
- components/point/FiltersBottomSheet.tsx : supprimé (bb2ac4e)
- Commits ca79b7d, bb2ac4e : présents dans git log

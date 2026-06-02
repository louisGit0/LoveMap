---
phase: 04-listes-cercle
plan: 02
subsystem: social-ui-cercle
tags: [UI-06, D-05, D-06, friends, annuaire, editorial, haptics]
requires:
  - "useFriends.unfriend (déjà implémenté — delete friendships + removeFriend store)"
  - "stores/friendStore.removeFriend (retrait optimiste)"
  - "components/ui/Input (recherche underline)"
  - "lib/haptics (warn/error)"
provides:
  - "friends/index « Le cercle » : annuaire éditorial (titre serifLight 36, recherche underline ui/Input, empty states + no-result, snackbars de retrait éditoriaux)"
  - "FriendItem : entrée d'annuaire (avatar carré rose, nom serif 20, @username mono droite, Carte underline T.primary, Retirer T.danger + Alert éditoriale)"
affects:
  - "app/(app)/(tabs)/friends/index.tsx"
  - "components/friends/FriendItem.tsx"
tech-stack:
  added: []
  patterns:
    - "useTheme() + makeStyles(T) via useMemo([T])"
    - "haptics fire-and-forget (jamais await) — warn à l'ouverture Alert, error à l'échec"
    - "Alert native iOS destructive déléguée via callback onUnfriend (zéro Supabase en composant)"
    - "retrait optimiste store (pas de re-fetch après unfriend)"
key-files:
  created: []
  modified:
    - "components/friends/FriendItem.tsx"
    - "app/(app)/(tabs)/friends/index.tsx"
decisions:
  - "« Carte » rendu en texte mono Eyebrow T.primary + textDecorationLine underline (plutôt que Button variant=underline qui mappe F.serif/T.text) — pour respecter §Typography Eyebrow mono + §Color action Carte T.primary"
  - "@username déplacé dans une colonne droite (alignItems flex-end) au-dessus des actions — signature éditoriale « métadonnées alignées droite » de l'archétype"
  - "Conversion des dernières occurrences F.sans*/F.sansMedium/F.sansLight du sous-bloc « Inviter » et du chevron « Demandes » vers serif/mono — pour satisfaire le gate §Typography « aucune F.sans*/F.serifMedium » sur cet écran (Rule 2 — honorer le contrat de design)"
metrics:
  duration: "~20 min"
  tasks_completed: 2
  files_modified: 2
  completed: 2026-06-02
---

# Phase 04 Plan 02: Le cercle (friends/index, UI-06) Summary

Refonte de l'écran « Le cercle » et de la ligne `FriendItem` en annuaire éditorial intime (archétype « table des matières »), avec retrait d'ami opt-in confirmé au ton « journal intime », câblé sur le hook `unfriend` existant — zéro nouvelle dépendance, zéro nouvel appel Supabase en composant.

## What Was Built

### Task 1 — `components/friends/FriendItem.tsx` (commit 880d951)
Ligne refondue en entrée d'annuaire :
- **Avatar carré inchangé** (D-05 lock) : `borderRadius:0`, fond `T.surface2`, bord `T.border`, initiale serif italic `T.primary` portée à fontSize 20 (Heading).
- **Nom** : `F.sans` 14 → `F.serif` italic 20 (Heading), `T.text`, `lineHeight` 26, `numberOfLines={1}`.
- **`@username`** : `F.mono` 10 `T.textFaint`, **aligné à droite** dans une colonne droite (`alignItems:'flex-end'`).
- **« Carte »** : texte mono Eyebrow `T.primary` + `textDecorationLine:'underline'` (filet), callback `onViewMap` conservé. Boîte bordée supprimée.
- **« Retirer »** : texte mono Eyebrow passé de `T.textFaint` → **`T.danger`**. Boîte bordée supprimée.
- **`handleUnfriend`** : ajout `haptics.warn()` à l'ouverture ; copie éditoriale — titre « Retirer du cercle ? », corps « {nom} ne verra plus vos moments partagés. Cette action est irréversible. », actions `[ Garder (cancel) · Retirer (destructive → onUnfriend) ]`. Exécution du delete **déléguée** à `onUnfriend` (aucun Supabase dans le composant).
- Null guard `if (!profile) return null;` ajouté (cohérence sibling `FriendRequestItem`). Spacing normalisé : `paddingVertical` 14 → 16 (lg), gap ancre→corps 12 (rowGap). Hit-slop ajouté sur les actions (touch target).

### Task 2 — `app/(app)/(tabs)/friends/index.tsx` (commit ec8605f)
Écran « Le cercle » refondu, logique data intacte :
- **Titre** « le cercle » → « **Le cercle** », style passé de 56/-2 à **36 / lineHeight 40 / -1** en `F.serifLight` italic.
- **Recherche** : `TextInput` brut + `IcoSearch` → `components/ui/Input` underline, placeholder « Rechercher dans le cercle », `ActivityIndicator` de chargement passé en prop `right`. Debounce 300ms + RPC `search_users` **inchangés**.
- **`handleUnfriend`** : succès → snackbar « Retiré du cercle. » ; échec → `haptics.error()` + snackbar « Échec — réessayez. ». Aucun re-fetch ajouté (retrait optimiste du store conservé).
- **Empty states** : « Votre cercle est vide. » / « Cherchez un nom pour inviter quelqu'un. ». **No-result** ajouté : « Aucun nom ne correspond. » (query ≥ 2 chars, non-loading, 0 résultat).
- **D-04 préservé** : pull-to-refresh, `SkeletonRow` au chargement, null guards.
- **`loadFriends` (l. 49-56) inchangé** (déviation rule-4 préexistante non étendue, hors périmètre).
- Imports nettoyés (`TextInput`, `IcoSearch` retirés), styles morts `searchRow`/`searchInput` remplacés par `searchInputContainer`/`searchNoResult`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Design contract] Purge des dernières polices proscrites F.sans* sur l'écran**
- **Found during:** Task 2 (gate acceptance « aucune occurrence de F.sans*/F.serifMedium »).
- **Issue:** Le sous-bloc « Inviter quelqu'un » (`resultName` `F.sans`, `addBtnText` `F.sansMedium`) et le chevron de la ligne « Demandes » (`requestsArrow` `F.sansLight`) utilisaient encore des polices proscrites par §Typography de l'UI-SPEC.
- **Fix:** `resultName` → `F.serif` italic 18 ; `addBtnText` → `F.mono` 10 uppercase (label d'action = Eyebrow) ; `requestsArrow` → `F.mono`. Présentation seule, aucune logique data touchée, aucune dépendance ajoutée.
- **Files modified:** `app/(app)/(tabs)/friends/index.tsx`
- **Commit:** ec8605f

Le « Carte » et le `@username` ont été interprétés selon le plan (« texte mono + filet » / colonne droite) plutôt que via le `Button variant="underline"` (qui mappe `F.serif`/`T.text` et ne satisferait pas §Color action Carte `T.primary` + §Typography Eyebrow mono) — documenté dans les décisions du frontmatter.

## Auth Gates
Aucune. Plan présentation-only sur des hooks/écrans existants.

## Verification
- **tsc baseline (début) = 21** (la baseline de phase a chuté de 36 → 21 après la suppression de `FiltersBottomSheet` en 04-01). Après Task 1 = 21, après Task 2 = 21. **0 nouvelle erreur introduite.**
- `F\.(sans|serifMedium)` : **0 occurrence** dans `friends/index.tsx` et `FriendItem.tsx` (Grep vérifié).
- `supabase\.` : **0 occurrence** dans `FriendItem.tsx` (delete délégué via `onUnfriend`).
- Manuel TestFlight (dark + light) en attente du gate device de fin de phase (build natif — OTA inopérant chez l'utilisateur).

## Known Stubs
Aucun. Toutes les données sont câblées sur les hooks/stores existants (`useFriends`, `friendStore`, RPC `search_users`).

## Threat Flags
Aucune nouvelle surface. Le delete reste mono-table par `friendship.id` sous RLS existante (T-04-02-01 mitigate) ; aucun champ de profil supplémentaire exposé (T-04-02-02 mitigate) ; aucune écriture sur `points`/`point_partners` (T-04-02-03 accept).

## Self-Check: PASSED
- `components/friends/FriendItem.tsx` — FOUND
- `app/(app)/(tabs)/friends/index.tsx` — FOUND
- `.planning/phases/04-listes-cercle/04-02-SUMMARY.md` — FOUND
- Commit 880d951 (Task 1) — FOUND
- Commit ec8605f (Task 2) — FOUND

---
phase: 05-auth-profil-finitions
plan: 03
subsystem: profile
tags: [ui, profile, bento, theme-toggle, a11y, ios-finitions, refonte]
requires:
  - "AppText display variant (05-01)"
  - "lib/haptics (FOND-03)"
  - "components/ui/{Button, Input, PressableScale}"
  - "usePoints() points (Analyse data)"
provides:
  - "Profile « page de couverture » : cover header (avatar carré 80px + nom Cover 56 + @username) + bento Analyse"
  - "Single accessible theme toggle (IcoSun/IcoMoon) (D-09)"
  - "Alert-only account deletion (D-08)"
affects:
  - "app/(app)/(tabs)/profile/index.tsx"
tech-stack:
  added: []
  patterns:
    - "AppText variant=display pour les grands chiffres serif (Cover 56 / Title 32)"
    - "Bento à tailles variées (taille = importance) — monochrome surface + accent unique T.primary"
    - "Avatar upload dynamic-require préservé verbatim (rules 14/15/17)"
key-files:
  created: []
  modified:
    - "app/(app)/(tabs)/profile/index.tsx"
decisions:
  - "statsRow (Entrées/Amis/Moyenne, chiffres rose D-04-non-conformes) et Anthologie pré-refonte retirés — remplacés par le bento canonique de l'UI-SPEC §Profil B ; navigation vers la liste conservée via l'onglet « Le carnet »"
  - "useFriends / friends / avgNote retirés (n'alimentaient que la statsRow supprimée) — un appel réseau de moins au montage du profil"
  - "Édition inline du prénom préservée (fonctionnalité), déplacée sur le tap du nom de couverture (la ligne « Modifier le prénom » redondante retirée)"
  - "Toggle thème en TouchableOpacity (et non PressableScale) car PressableScale ne forwarde pas accessibilityLabel et ne doit pas être forké (D-10) — bascule immédiate + accessibilityRole=switch"
  - "Messages d'échec génériques « Échec — réessayez. » (suppression de « Erreur : » + message Supabase brut) — mitigation T-05-03-05"
metrics:
  duration: "~25 min"
  completed: 2026-06-02
  tasks: 2
  files: 1
  tsc_baseline: 20
  tsc_after: 20
---

# Phase 5 Plan 3: Profil « page de couverture » + bento Analyse Summary

Refonte de présentation de `profile/index.tsx` vers l'archétype « page de couverture » (UI-08) : cover (avatar carré 80px + nom Cover 56 serif + @username mono), section « Analyse » en mini-bento (grande tuile = nombre de moments en T.text), toggle thème unique accessible (D-09), suppression de compte par Alert native seule (D-08), et `paddingBottom: insets.bottom + 32` (IOS-04) — l'upload avatar fragile (require dynamique) et les handlers de compte étant préservés verbatim.

## What Was Built

### Task 1 — Cover header + bento Analyse (commit 104fe09)
- **Cover** : eyebrow mono « MOI », avatar carré 80px (borderRadius:0, exception D-12) en `PressableScale` (tap → `haptics.tap()` + `handlePickAvatar`), badge `IcoPlus`, nom via `AppText variant="display"` (Cover 56, T.text) tappable pour l'édition inline du prénom, `@username` en eyebrow mono.
- **Bento Analyse** (tuiles `T.surface`, `cardRadius` 16 + `borderCurve:'continuous'`, padding 16, gaps 24/16) :
  - **A** (pleine largeur, minHeight 140) — `String(points.length)` en `AppText display` 56 **T.text (pas rose, D-04)** + label « PAGES DU CARNET ».
  - **B** (demi) — durée totale (`totalMinutes` useMemo) en display 32 T.text + « DURÉE TOTALE ».
  - **C** (demi) — `topMonths` useMemo, libellés serif + comptes mono.
  - **D** (pleine largeur) — distribution des notes (`noteDistribution` useMemo) : piste `T.surface2`, remplissage `T.primary` (pattern existant réutilisé verbatim).
  - **Empty state** (0 moment) : « 0 » + « PAGES DU CARNET » + « Le carnet est encore vierge. » ; B/C/D masquées.
- Les 3 useMemos (`noteDistribution`/`topMonths`/`totalMinutes`) restent inchangés — aucun nouveau calcul, aucun nouvel appel réseau.

### Task 2 — Toggle unique + Alert delete + Button + insets (commit 6c5edc3)
- **Apparence** : un seul toggle `IcoSun/IcoMoon` (icône en `T.primary`), cible ≥ 44, `haptics.select()`, `accessibilityRole="switch"` + `accessibilityState={{checked:isDark}}` + `accessibilityLabel` « Basculer vers le thème clair/sombre » (checker_flag Visuals). Le `Switch` « Mode sombre » dupliqué et son import sont retirés (D-09).
- **Compte** : lignes d'action `PressableScale` ≥ 44 (`haptics.tap()`) « Modifier l'e-mail » / « Modifier le mot de passe » avec chevron mono `›`/`⌄` ; confirmations via `<Button variant="coral">`. Succès → « Enregistré. » + `haptics.success()` ; échec → « Échec — réessayez. » + `haptics.error()`. `handleChangeEmail`/`handleChangePassword` appellent toujours `supabase.auth.updateUser`.
- **Suppression (D-08)** : champ « EFFACER » + state `deleteConfirm` retirés. `handleDeleteAccount` ouvre une `Alert` native — titre « Supprimer le compte ? », corps « Toutes vos pages seront effacées. Cette action est irréversible. », actions [ Garder · Supprimer (destructive) ]. `haptics.warn()` à l'ouverture, `haptics.error()` à l'échec. `supabase.functions.invoke('delete-account')` + `reset()` + nav inchangés.
- **Zone irréversible** : `<Button variant="danger">`, eyebrow en `T.danger`.
- **IOS-04** : `dangerBlock paddingBottom: insets.bottom + 32` (plus de littéral 60).
- `updateBtn`/`deleteBtn` (off-discipline `F.sansMedium`) remplacés par `Button` — `Button.tsx` non modifié (D-10).

## Non-Regression (rules 14/15/17 — highest-risk item)
`handlePickAvatar` copié **mot pour mot** : `require('expo-image-picker')` à l'intérieur de la fonction, `launchImageLibraryAsync` sans `requestMediaLibraryPermissionsAsync`, `require('expo-file-system/legacy')` pour le base64. Vérifié par grep : aucun `import * as ImagePicker`, aucun import statique `expo-image-picker`/`expo-file-system`, aucun appel `requestMediaLibraryPermissionsAsync` (seul un commentaire le mentionne). Aucun `expo install` lancé (image-picker reste 17.0.11 — STAB-01).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Toggle thème : PressableScale → TouchableOpacity**
- **Found during:** Task 2 (tsc TS2322 à l'ajout d'`accessibilityLabel` sur `PressableScale`).
- **Issue:** `PressableScale` (Props : onPress/onLongPress/children/style/scaleValue/disabled) ne forwarde pas `accessibilityLabel` ; le plan exige un `accessibilityLabel` sur le toggle (checker_flag) mais interdit de forker les primitives (D-10).
- **Fix:** Toggle thème rendu en `TouchableOpacity` (accepte les props a11y) — cohérent avec « bascule immédiate » de l'UI-SPEC §Motion ; ajout `accessibilityRole="switch"` + `accessibilityState`. `Button.tsx`/`PressableScale.tsx` non modifiés.
- **Files modified:** app/(app)/(tabs)/profile/index.tsx
- **Commit:** 6c5edc3

**2. [Rule 2 - Critical] Suppression de la fuite d'erreur Supabase (T-05-03-05)**
- **Found during:** Task 2 (restyle compte).
- **Issue:** `handleChangeEmail`/`handleChangePassword` affichaient `'Erreur : ' + error.message` (message Supabase brut en UI — divulgation d'information, T-05-03-05).
- **Fix:** Remplacé par la copie générique française « Échec — réessayez. » + `haptics.error()`, conforme au contrat de copie et à la disposition `mitigate` du threat register.
- **Files modified:** app/(app)/(tabs)/profile/index.tsx
- **Commit:** 6c5edc3

**3. [Présentation] statsRow + Anthologie + useFriends retirés**
- **Found during:** Task 1.
- **Issue/Decision:** L'UI-SPEC §Profil verrouille la composition (cover → bento Analyse → compte → danger). Les `statsRow` (chiffres rose, non-conformes D-04) et `Anthologie` pré-refonte n'y figurent pas ; `useFriends`/`friends`/`avgNote` n'alimentaient que la statsRow supprimée.
- **Fix:** Sections retirées et remplacées par le bento canonique ; `useFriends` et `avgNote` supprimés (un appel réseau de moins au montage). Aucune capacité perdue : la navigation vers la liste reste via l'onglet « Le carnet ».
- **Files modified:** app/(app)/(tabs)/profile/index.tsx
- **Commit:** 104fe09

## Threat Surface
Aucune nouvelle surface de sécurité. Conforme au threat register du plan : suppression toujours côté serveur (Edge Function) confirmée par Alert native (T-05-03-01) ; ni `date_of_birth` ni `push_token` rendus (T-05-03-02) ; avatar dynamic-require préservé (T-05-03-03) ; aucune dépendance ajoutée (T-05-SC) ; messages d'échec génériques (T-05-03-05, appliqué).

## Verification
- `npx tsc --noEmit` : **20** erreurs (baseline 20) — **0 nouvelle erreur**. Les 2 erreurs dans `profile/index.tsx` (l.164 `avatar_url`, l.186 `display_name`) sont préexistantes (types Supabase `never`) et appartiennent à du code préservé verbatim.
- Grep : avatar dynamic-require intact ; `functions.invoke('delete-account')` présent ; aucun `Switch`/`EFFACER`/`deleteConfirm` résiduel ; aucun import statique image-picker/file-system.
- Device (à valider en build de phase) : upload avatar non régressé sur l'onglet « Moi », bento lisible, toggle unique + VoiceOver, e-mail/mdp, Alert-only delete, home indicator dégagé, Dynamic Type max, clair + sombre.

## Known Stubs
Aucun. La grande tuile bento est câblée sur `points.length` (donnée réelle via `usePoints`), pas une valeur en dur.

## Commits
- 104fe09 — feat(05-03): profile cover header + bento Analyse (UI-08, D-03/D-04)
- 6c5edc3 — feat(05-03): single theme toggle (D-09) + Alert-only delete (D-08) + Button actions + insets (IOS-04)

## Self-Check: PASSED
- FOUND: .planning/phases/05-auth-profil-finitions/05-03-SUMMARY.md
- FOUND: app/(app)/(tabs)/profile/index.tsx
- FOUND commit: 104fe09
- FOUND commit: 6c5edc3

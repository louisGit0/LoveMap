---
phase: 01-stabilisation-fondations
plan: 01
status: complete-with-blockage
verdict: FAIL-then-fixed
requirements: [STAB-01, STAB-02, STAB-03]
---

> **MISE À JOUR FINALE : les 3 items STAB passent.** STAB-02/03 validés sur #16 (migration 011, RLS 42P17). STAB-01 validé sur #18 (« Ça marche ») après : expo-image-picker 16→17 (fix crash) + migration 012 (RLS Storage avatars, l'upload était refusé). Voir section « Résolution » en bas.

# Summary 01-01 — Validation STAB (verdict : BLOCAGE)

## Deliverable produit

`STAB-CHECKLIST.md` rédigée et exécutée par l'utilisateur sur les builds TestFlight actuels (#15/#16). Verdict capturé.

## Verdict utilisateur : ÉCHEC (build #17 bloqué — D-07)

Les builds #15/#16 ne sont **pas** stables. Aucun des 3 items ne passe.

| Item | Build | Résultat | Anomalie rapportée |
|------|-------|----------|--------------------|
| STAB-01 | #15 | ÉCHEC | « Crash dès le clic sur l'avatar » (galerie photo) |
| STAB-02 | #16 | BLOQUÉ | Impossible de créer un point : « message d'erreur quand je clique sur sceller la page » → pas de point pour tester le dézoom |
| STAB-03 | #16 | BLOQUÉ | Même blocage : création de point échoue, donc taguage partenaire intestable |

L'utilisateur a coché « Au moins un item échoue → blocage : un correctif est nécessaire AVANT de lancer le build #17. »

## Conséquence sur la phase (D-07)

La séquence stricte D-07 interdit de produire le build #17 tant que STAB-01/02/03 ne passent pas. **Le plan 01-04 Task 2 (build #17) est donc bloqué.** La phase 1 ne peut pas être clôturée en l'état : il faut d'abord corriger les deux bugs préexistants ci-dessous, reconstruire/retester, puis relancer la validation STAB.

Note : ces bugs préexistent dans les binaires #15/#16 et sont indépendants du code Phase 1 (01-02/01-03/01-04), qui n'a jamais été embarqué dans un build TestFlight.

## Diagnostic code (préliminaire)

### Bug A — STAB-01 : avatar / galerie
- `app/(app)/profile/index.tsx` `handlePickAvatar` utilise déjà le dynamic require (ImagePicker + FileSystem) et n'appelle pas `requestMediaLibraryPermissionsAsync()` (conforme CLAUDE.md règles 14/15).
- **Bug confirmé (haute confiance) :** SDK 54 / `expo-file-system@19.0.22` a déplacé `readAsStringAsync` et `EncodingType` vers l'API **legacy** (`expo-file-system/legacy`). L'import principal ne les expose plus → `FileSystem.readAsStringAsync(...)` est `undefined` à l'exécution → l'upload d'avatar échoue (erreur attrapée par le try/catch). Confirmé aussi par l'erreur tsc `profile/index.tsx(151,31): Property 'EncodingType' does not exist`.
- **Réserve :** le symptôme « crash dès le clic » (avant même de choisir une image) suggère en plus un crash natif au niveau du picker, non attrapable en JS — nécessite les logs de crash device pour confirmer.

### Bug B — STAB-02/03 : création de point
- `point/new.tsx handleSubmit` → `usePoints.createPoint` → RPC `supabase.rpc('create_point', {...})`. En cas d'erreur RPC, le message Supabase remonte tel quel au snackbar.
- **Message d'erreur exact non capturé** par l'utilisateur — requis pour un diagnostic ferme. Hypothèses : mismatch de signature `create_point` après migrations 009/010, type de `p_happened_at`, ou RLS. À inspecter via le RPC réel (MCP Supabase) + le message device.

## Résolution (cycle de correctif gap-closure)

### Bug B — STAB-02/03 (création de point) : CORRIGÉ + VALIDÉ
- **Cause exacte** (message device fourni) : `[42P17] infinite recursion detected in policy for relation "points"`.
- Récursion : `points_select` (migration 010) sous-requête `point_partners` ⟷ `point_partners_select` (001) sous-requête `points`. Le RPC `create_point` (SECURITY DEFINER) réussissait, mais le SELECT de relecture côté client déclenchait la récursion.
- **Correctif** : migration `011_fix_points_rls_recursion.sql` — déplace la vérification « partenaire en attente » dans `is_pending_partner(uuid)` (SECURITY DEFINER, `search_path` épinglé, EXECUTE limité à `authenticated`), brisant le cycle. Appliquée en production via MCP + vérifiée (SELECT authentifié sur `points`/`point_partners` ne récurse plus).
- **Validation** : utilisateur a re-testé sur #16 → « Ça marche maintenant ». STAB-02/03 PASS.
- Note : correctif **serveur** → effectif immédiatement sur les builds existants, sans rebuild.

### Bug A — STAB-01 (avatar) : CAUSE RACINE TROUVÉE (validation sur #18)
- **Symptôme #17** : « Impossible d'ouvrir la galerie » puis crash (le catch JS de `launchImageLibraryAsync` se déclenchait — donc pas un crash natif inattrapable, mais le module natif rejetait l'appel).
- **Cause racine (confirmée via `expo install --check`)** : `expo-image-picker@16.0.6` alors que SDK 54 attend `~17.0.11`. Mismatch majeur d'interface JS↔natif → l'appel rejette et l'app meurt. Présent depuis #15 — explique la persistance du crash à travers tous les builds.
- **Correctifs** :
  1. `expo-image-picker` 16.0.6 → **17.0.11** (`npx expo install`) — correctif racine.
  2. `expo-file-system` → API legacy (déjà appliqué — nécessaire pour l'upload base64, indépendant).
  3. Catch de `launchImageLibraryAsync` surface désormais l'erreur réelle (au lieu de la masquer).
- **Couche suivante révélée par le fix du crash** : une fois la galerie ouverte, l'upload échouait avec « new row violates RLS ». Cause : `storage.objects` avait RLS activé mais **zéro policy** → tout upload refusé (bucket public = lecture seule). Corrigé par **migration 012** (policies `avatars_insert_own` / `avatars_update_own` scopées à `<uid>.<ext>` + `avatars_select_public`). Serveur, live.
- **Validation finale** : utilisateur sur #18 → « Ça marche » (galerie ouverte, photo uploadée, avatar à jour). **STAB-01 PASS.** tsc : aucune nouvelle erreur (39 baseline).
- Note dette : `expo install --check` révèle d'autres paquets en léger retard (patch). Non bloquants ; alignement complet hors périmètre Phase 1.

## Self-Check: PASSED — bugs bloquants corrigés ; STAB-01 en validation finale sur #17

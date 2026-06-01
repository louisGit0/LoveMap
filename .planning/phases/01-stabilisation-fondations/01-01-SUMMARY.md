---
phase: 01-stabilisation-fondations
plan: 01
status: complete-with-blockage
verdict: FAIL
requirements: [STAB-01, STAB-02, STAB-03]
---

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

## Self-Check: PASSED (deliverable produit, verdict capturé) — mais PHASE BLOQUÉE

---
phase: 5
slug: auth-profil-finitions
status: passed
verified: 2026-06-02
method: static gates + device validation (TestFlight build #29)
---

# Phase 5 — Verification (Auth, Profil & Finitions)

**Verdict : PASSED** — 3/3 requirements, validé device (#29, utilisateur « Validé »), clair + sombre + Dynamic Type. tsc 20 (0 nouvelle erreur). **Dernière phase → milestone v1.0 complet (22/22).**

## Goal-backward

**Goal :** Refondre auth + profil en « page de couverture » + finaliser la cohérence iOS transverse.
Les 3 écrans (login, register, profile) refondus selon l'archétype + passe IOS-04 sur les 9 écrans. Aucun nouvel écran, aucune dérive de scope.

## Requirements

| Req | Vérif statique | Vérif device #29 |
|-----|----------------|------------------|
| UI-01 | login : eyebrow « LOVEMAP · ÉDITION INTIME » + `AppText display` Cover hero + champs underline visibles + CTA ; register : stepper conservé, `APP_CONFIG.MIN_AGE` (bug corrigé), CTA « Vérifier mon âge » | ✅ couvertures auth, < 18 bloque, signup OK |
| UI-08 | profile : avatar carré 80px, nom Cover serif, bento (grande tuile `points.length` « PAGES DU CARNET » en T.text), toggle unique (Switch retiré) + a11y, delete Alert-only (champ EFFACER retiré), **avatar upload préservé verbatim** | ✅ profil cover + bento, avatar upload OK (non régressé), toggle, suppression Alert |
| IOS-04 | 0 `SafeAreaView` ; home indicator via `insets.bottom + N` (login/register/profile/list/cercle/demandes corrigés) ; Dynamic Type plafonné par rôle (AppText + caps héros) ; sweep tokens ; clair+sombre | ✅ home indicator dégagé, Dynamic Type grande taille sans casse sur 9 écrans |

## Static gate

- `npx tsc --noEmit` = **20** (baseline ; le fix `MIN_AGE` a retiré une erreur pré-existante TS2305, 21→20). Phase 5 : **0 nouvelle erreur**.
- **Non-régression critique avatar (rules 14/15/17) confirmée** : `require('expo-image-picker')` dynamique dans la fonction, `require('expo-file-system/legacy')`, ZÉRO import statique, ZÉRO `requestMediaLibraryPermissionsAsync` (faux positif grep = commentaire + annotation de type `import('expo-image-picker').ImagePickerResult`).
- Sécurité : `supabase.auth.updateUser` (email/mdp) + `functions.invoke('delete-account')` inchangés ; `date_of_birth`/`push_token` non exposés ; trigger d'âge serveur autoritaire (fix client = défense en profondeur).

## Décisions réalisées

D-01…D-12 toutes implémentées (cf. 05-CONTEXT.md). Notable : D-06 (AppText display + caps DT), D-08 (delete Alert-only), D-09 (toggle unique + a11y), D-11 (fix MIN_AGE), D-12 (CTA).

## Dette connue (hors périmètre, documentée, non étendue)

- `requests.tsx handleCancel` + `friends/index.tsx loadFriends` : appels Supabase directs pré-existants (déviation rule-4) — laissés tels quels.

## Build

- EAS natif **#29** (production, auto-submit TestFlight). Validé device clair + sombre + Dynamic Type.

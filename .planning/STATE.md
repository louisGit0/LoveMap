---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: "Phase 05 en cours (3/4 plans) — 05-03 refonte profil « page de couverture » + bento Analyse exécuté"
stopped_at: Phase 5 — 05-03 terminé (profil cover + bento + toggle unique a11y + delete Alert seule + insets)
last_updated: "2026-06-02T19:45:00.000Z"
progress:
  total_phases: 5
  completed_phases: 4
  total_plans: 21
  completed_plans: 20
  percent: 95
---

# STATE — LoveMap (Refonte UI/UX iOS)

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Core value:** L'expérience visuelle et tactile doit donner l'impression d'un produit iOS premium, beau, fluide et stable sur iPhone.
**Current focus:** Phase 5 — Auth, Profil & Finitions

## Milestone

**Refonte UI/UX iOS** — stabilisation post-#15/#16 + refonte éditoriale × iOS hybride (carte, 9 écrans, patterns iOS natifs).

## Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Stabilisation & Fondations | ✅ Terminé — 8/8 req · builds #17/#18 · migrations 011+012 |
| 2 | Carte stylisée | ✅ Terminé — 4/4 req · vérifié 4/4 · validé device #19 · style Mapbox custom + pivot D-12 |
| 3 | Création & Détail de point (sheets natifs) | ✅ Terminé — 5/5 plans · validé device #26 · **pivot formSheet→modal** (bug iOS 26 RNS 4.16 #3235) · aperçu carte retiré (location stamp) (03-01 nav Stack+(tabs) · 03-02 tap-pin → détail direct · 03-03 création carnet note-first · 03-04 détail carnet lecture + segments date #2125 · 03-05 validation device + correctifs sheet) |
| 4 | Listes & Cercle | ✅ Terminé — 3/3 plans · validé device #28 · liste table des matières + cercle (retrait d'ami) + demandes (consentement taguage inline `respondToTag`) · `FiltersBottomSheet` supprimé |
| 5 | Auth, Profil & Finitions | 🔄 En cours — 3/4 plans · 05-01 AppText `display` (levier D-06/IOS-04) · 05-02 refonte auth login + register « page de couverture » + fix MIN_AGE (D-11) + CTA « Vérifier mon âge » (D-12) + insets.bottom (IOS-04) · 05-03 refonte profil « page de couverture » + bento Analyse (grande tuile = points.length T.text) + toggle unique a11y (D-09) + delete Alert seule (D-08) + avatar PRESERVE (UI-08) + insets · tsc 20 (0 nouvelle erreur) |

**Requirements:** 20 / 22 complete (Phase 1 : STAB-01/02/03, FOND-01/02/03/04, IOS-03 · Phase 2 : MAP-01, MAP-02, MAP-03, UI-02 · Phase 3 : IOS-01, IOS-02, UI-03, UI-04 · Phase 4 : UI-05, UI-06, UI-07 · Phase 5 : UI-01, UI-08 — IOS-04 en attente du sweep 05-04)

## Config

- Mode: interactive
- Granularity: standard
- Parallelization: true
- Model profile: quality
- Workflow: research ✓ · plan_check ✓ · verifier ✓

## Notes

- `gsd-sdk` opérationnel → agents GSD natifs utilisés pour le plan de la Phase 1 (pattern-mapper, planner, plan-checker).
- Phase 1 planifiée : 4 plans en 3 vagues. Vague 1 = 01-01 (checklist STAB, manuel) + 01-02 (lib/haptics.ts + AppText) · Vague 2 = 01-03 (câblage haptique IOS-03) · Vague 3 = 01-04 (socle natif reanimated/gesture-handler + runtimeVersion fingerprint + build #17, manuel). Recherche projet réutilisée (pas de RESEARCH.md de phase). Couverture : 8/8 requirements, 10/10 décisions.
- Pièges critiques connus : runtimeVersion statique (TestFlight), imports dynamiques expo-image-picker/file-system, OTA inopérants chez l'utilisateur (builds natifs requis).
- Migrations Supabase 009 + 010 appliquées manuellement par l'utilisateur (confirmé).
- **Phase 1 exécutée et vérifiée (8/8, gsd-verifier PASS).** Code : lib/haptics.ts, AppText, câblage haptique, socle natif reanimated v4 + gesture-handler + GestureHandlerRootView + runtimeVersion fingerprint.
- **Cycle de correctif STAB (régressions #15/#16 révélées par la validation)** : migration **011** (récursion RLS `42P17` sur points → STAB-02/03), migration **012** (RLS Storage bucket avatars), upgrade `expo-image-picker` 16→17.0.11 + `expo-file-system` legacy (crash avatar STAB-01). Migrations 011/012 appliquées en prod via MCP + vérifiées. Validé device sur builds #17 (worklets) et #18 (avatar).
- Nouvelles règles CLAUDE.md 16-18 (alignement paquets Expo/SDK, API file-system legacy, récursion RLS).
- Dette connue : ~39 erreurs tsc baseline préexistantes (types Supabase `never`, etc.) — hors périmètre Phase 1, 0 nouvelle erreur introduite. `expo install --check` signale d'autres paquets en léger retard (patch).

- **Phase 2 terminée, vérifiée (gsd-verifier 4/4) et validée device (build #19).** Style Mapbox Studio custom enrichi (29 calques : parcs, relief, 3D, halo rose, POI) injecté via `EXPO_PUBLIC_MAPBOX_STYLE` (.env.local + env EAS). Pivot design **D-12** (formes iOS arrondies, FAB squircle, design system theme.ts + CLAUDE.md révisés) appliqué — s'étend aux Phases 3-5. 0 nouvelle erreur tsc.
- Style JSON versionné : `.planning/phases/02-carte-stylis-e/lovemap-noir-rose.style.json`. Ajustable dans Studio sans rebuild (re-publier, URL inchangée).

## Next Step

**Phase 5 en cours — 05-03 exécuté (3/4 plans).** Reste **05-04** (passe IOS-04 sur les 6 écrans hors-refonte, vague 3), puis build de phase + validation device. 05-03 a refondu `profile/index.tsx` en « page de couverture » : cover (avatar carré 80px en PressableScale + nom Cover 56 serif T.text + @username mono), section Analyse en mini-bento (grande tuile = `points.length` en display 56 **T.text, pas rose** D-04 ; durée totale ; mois actifs ; distribution track surface2/fill primary), toggle thème **unique** IcoSun/IcoMoon (Switch dupliqué retiré, D-09) avec accessibilityLabel + role switch (checker_flag Visuals), suppression de compte par **Alert native seule** (champ « EFFACER » + state retirés, D-08 ; haptics.warn à l'ouverture / error à l'échec), actions compte via `Button` (variant coral/danger ; `Button.tsx` non modifié, D-10), `paddingBottom: insets.bottom + 32` (IOS-04). **Avatar upload préservé verbatim** (require dynamique image-picker + file-system/legacy, rules 14/15/17 — item le plus à risque). statsRow + Anthologie pré-refonte retirés (remplacés par le bento) ; useFriends/avgNote retirés (n'alimentaient que la statsRow). Messages d'échec génériques « Échec — réessayez. » (plus de message Supabase brut, T-05-03-05). tsc 20 (0 nouvelle erreur ; les 2 erreurs profil l.164/186 sont préexistantes, code préservé).

Baseline tsc phase = **20** (après le fix MIN_AGE de 05-02). Nouveau code 05-03 : 0 nouvelle erreur. **Gate « 0 nouvelle erreur » = 20 pour les plans restants de la Phase 5.**

Dette connue laissée (hors périmètre) : `handleCancel` (section « Envoyées » de requests.tsx) garde un appel Supabase direct (déviation rule-4 pré-existante) — documenté, non étendu ; `friends/index.tsx loadFriends` idem. À router via hook lors d'une passe future si souhaité.

## Session

- **Stopped at:** Phase 5 — 05-03 terminé (refonte profil « page de couverture » + bento Analyse)
- **Resume file:** .planning/phases/05-auth-profil-finitions/05-CONTEXT.md

---
*Last updated: 2026-06-02 after 05-03 (refonte profil « page de couverture » + bento Analyse + toggle unique a11y D-09 + delete Alert seule D-08 + avatar PRESERVE + IOS-04 insets). Phase 5 : 3/4 plans, tsc 20 (baseline 20, 0 nouvelle erreur).*

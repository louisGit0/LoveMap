---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: "Phase 05 terminée (4/4 plans) — 05-04 passe IOS-04 (home indicator insets + caps heroes) exécutée · milestone v1.0 code-complete"
stopped_at: Phase 5 — 05-04 terminé (sweep IOS-04 sur les 6 écrans hors-refonte) · milestone v1.0 code-complete
last_updated: "2026-06-02T20:05:00.000Z"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 21
  completed_plans: 21
  percent: 100
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
| 5 | Auth, Profil & Finitions | ✅ Terminé — 4/4 plans · 05-01 AppText `display` (levier D-06/IOS-04) · 05-02 refonte auth login + register « page de couverture » + fix MIN_AGE (D-11) + CTA « Vérifier mon âge » (D-12) + insets.bottom (IOS-04) · 05-03 refonte profil « page de couverture » + bento Analyse (grande tuile = points.length T.text) + toggle unique a11y (D-09) + delete Alert seule (D-08) + avatar PRESERVE (UI-08) + insets · 05-04 passe IOS-04 sur les 6 écrans hors-refonte (home indicator insets.bottom + 64 + caps heroes 1.25/1.15, clair+dark) · tsc 20 (0 nouvelle erreur) |

**Requirements:** 22 / 22 complete (Phase 1 : STAB-01/02/03, FOND-01/02/03/04, IOS-03 · Phase 2 : MAP-01, MAP-02, MAP-03, UI-02 · Phase 3 : IOS-01, IOS-02, UI-03, UI-04 · Phase 4 : UI-05, UI-06, UI-07 · Phase 5 : UI-01, UI-08, IOS-04 ✓) — **milestone v1.0 code-complete**

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

**Phase 5 terminée (4/4 plans) — milestone v1.0 code-complete.** 05-04 a exécuté la passe IOS-04 (D-07) sur les 6 écrans hors-refonte : (1) `point/list`, `friends/index`, `friends/requests` — `paddingBottom: 100` magique réconcilié en **`insets.bottom + 64`** (dégage la tab bar opaque 83px, suit le home indicator) + plafond Dynamic Type sur le hero serifLight 36 de chaque écran (« Le carnet » / « Le cercle » / « Demandes » → `maxFontSizeMultiplier={1.25}`) ; (2) `point/new` + `point/[id]` — hero note serifLight Display plafonné à **1.15** ; padding home-indicator (`insets.bottom + 32`) **vérifié** déjà conforme ; (3) `map/index` — FAB (`insets.bottom + 80`) et hint (`insets.bottom + 148`) **vérifiés** insets-based, aucun hero serif in-file (le texte d'en-tête vit dans le composant partagé `MapHeader`, hors périmètre). Sweep surgical : heroes uniquement (Pitfall 3 évité), aucune primitive partagée touchée, tab bar opaque inchangée (règle 13), 0 hex/fontFamily en dur introduit.

**Reste pour clore le milestone :** build de phase (orchestrateur) + validation device TestFlight clair+dark (9 écrans : rien sous le home indicator, Dynamic Type max sans casse des heroes, tab bar opaque).

Baseline tsc phase = **20**. Nouveau code 05-04 : 0 nouvelle erreur (tsc reste 20).

Dette connue laissée (hors périmètre, non étendue cette phase) : `handleCancel` (section « Envoyées » de requests.tsx) garde un appel Supabase direct (déviation rule-4 pré-existante) — documenté, non touché ; `friends/index.tsx loadFriends` idem. À router via hook lors d'une passe future si souhaité.

## Session

- **Stopped at:** Phase 5 — 05-04 terminé (passe IOS-04 sur les 6 écrans hors-refonte) · milestone v1.0 code-complete
- **Resume file:** .planning/phases/05-auth-profil-finitions/05-CONTEXT.md

---
*Last updated: 2026-06-02 after 05-04 (passe IOS-04 : home indicator insets.bottom + 64 + caps heroes 1.25/1.15, clair+dark). Phase 5 : 4/4 plans, milestone v1.0 code-complete, tsc 20 (baseline 20, 0 nouvelle erreur).*

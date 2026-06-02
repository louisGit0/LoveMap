---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: Phase 03 terminée (5/5 plans) — validée device #26
stopped_at: 03-05 validé device — pivot formSheet→modal (bug iOS 26 RNS 4.16 #3235 : contenu ancré en bas = sheet noir, non corrigeable JS) + aperçu carte retiré des sheets (location stamp/adresse, MapView GL & <Image> noirs en sheet) + layout (no KAV, automaticallyAdjustKeyboardInsets). Build #26 OK.
last_updated: "2026-06-02T14:15:00.000Z"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 15
  completed_plans: 15
  percent: 60
---

# STATE — LoveMap (Refonte UI/UX iOS)

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Core value:** L'expérience visuelle et tactile doit donner l'impression d'un produit iOS premium, beau, fluide et stable sur iPhone.
**Current focus:** Phase 03 — cr-ation-d-tail-de-point-sheets-natifs

## Milestone

**Refonte UI/UX iOS** — stabilisation post-#15/#16 + refonte éditoriale × iOS hybride (carte, 9 écrans, patterns iOS natifs).

## Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Stabilisation & Fondations | ✅ Terminé — 8/8 req · builds #17/#18 · migrations 011+012 |
| 2 | Carte stylisée | ✅ Terminé — 4/4 req · vérifié 4/4 · validé device #19 · style Mapbox custom + pivot D-12 |
| 3 | Création & Détail de point (sheets natifs) | ✅ Terminé — 5/5 plans · validé device #26 · **pivot formSheet→modal** (bug iOS 26 RNS 4.16 #3235) · aperçu carte retiré (location stamp) (03-01 nav Stack+(tabs) · 03-02 tap-pin → détail direct · 03-03 création carnet note-first · 03-04 détail carnet lecture + segments date #2125 · 03-05 validation device + correctifs sheet) |
| 4 | Listes & Cercle | ⬜ Not started |
| 5 | Auth, Profil & Finitions | ⬜ Not started |

**Requirements:** 16 / 22 complete (Phase 1 : STAB-01/02/03, FOND-01/02/03/04, IOS-03 · Phase 2 : MAP-01, MAP-02, MAP-03, UI-02 · Phase 3 : IOS-01, IOS-02, UI-03, UI-04)

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

**Phase 3 terminée et validée device (#26 + #27).** Démarrer **Phase 4 — Listes & Cercle** (`/gsd:discuss-phase 4` → ui → plan → execute).

Aperçu carte **restauré build #27** (validé device) : `<Image>` statique Mapbox (`mapboxStaticUrl()`) + pin rose RN, dans détail + création — fiable dans le `modal` (le noir d'avant venait du `formSheet`, pas de l'image).

**Cycle de correctifs sheet (builds #20→#26), révélé par la validation device :**
- #20–#22 : contenu « noir en haut ». Fausse piste « carte noire ».
- Aperçu carte retiré (MapView GL **et** `<Image>` Mapbox rendent noir dans un sheet) → location stamp (création) / adresse en métadonnées (détail).
- #24 : layout (suppression `KeyboardAvoidingView`, `contentInsetAdjustmentBehavior="never"`, `automaticallyAdjustKeyboardInsets`). Insuffisant.
- #25 : taille explicite `useWindowDimensions` (workaround #2522) → a **empiré** (sheet entièrement noir, contenu hors écran).
- **#26 ✅ cause racine** : `formSheet` (détents custom) cassé sur **iOS 26 + react-native-screens 4.16** ([#3235](https://github.com/software-mansion/react-native-screens/issues/3235), contenu ancré en bas, non corrigé jusqu'à 4.20+, non corrigeable JS) → bascule vers **`presentation: 'modal'`** (carte pageSheet native, swipe-dismiss conservé) qui rend correctement. Validé device.

## Session

- **Stopped at:** Phase 4 contexte capturé (04-CONTEXT.md) — décisions : note /10 comme gros chiffre, sections par mois, filtres inline, retrait d'ami opt-in. Enchaînement ui → plan → execute.
- **Resume file:** .planning/phases/04-listes-cercle/04-CONTEXT.md

---
*Last updated: 2026-06-02 after 03-05 (validation device #26, pivot formSheet→modal #3235, Phase 3 terminée 5/5)*

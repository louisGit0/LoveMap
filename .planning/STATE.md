---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: "Phase 04 code complet (3/3 plans) — 04-01 (UI-05) + 04-02 (UI-06) + 04-03 (UI-07) exécutés ; gate device de fin de phase en attente"
stopped_at: "Phase 4 plan 04-03 exécuté (UI-07 — Demandes refondues : 2 sections eyebrow mono « DEMANDES REÇUES » + « TAGUAGES EN ATTENTE » + Envoyées discrète ; FriendRequestItem boutons texte paramétrés (Accepter/Refuser · Sceller/Décliner, coral/ghost, D-12) + nom serif 20 ; consentement de taguage INLINE via nouvelle méthode hook useFriends.respondToTag (mono-table point_partners, is_visible via trigger, RLS mig 010/011) — plus de navigation « Répondre → » ; empty states D-07 ; W2 corrigé (refus amitié haptics.tap→warn). 0 nouvelle erreur tsc (21). Vérif device en attente."
last_updated: "2026-06-02T18:20:00.000Z"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 17
  completed_plans: 17
  percent: 71
---

# STATE — LoveMap (Refonte UI/UX iOS)

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-29)

**Core value:** L'expérience visuelle et tactile doit donner l'impression d'un produit iOS premium, beau, fluide et stable sur iPhone.
**Current focus:** Phase 4 — Listes & Cercle

## Milestone

**Refonte UI/UX iOS** — stabilisation post-#15/#16 + refonte éditoriale × iOS hybride (carte, 9 écrans, patterns iOS natifs).

## Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | Stabilisation & Fondations | ✅ Terminé — 8/8 req · builds #17/#18 · migrations 011+012 |
| 2 | Carte stylisée | ✅ Terminé — 4/4 req · vérifié 4/4 · validé device #19 · style Mapbox custom + pivot D-12 |
| 3 | Création & Détail de point (sheets natifs) | ✅ Terminé — 5/5 plans · validé device #26 · **pivot formSheet→modal** (bug iOS 26 RNS 4.16 #3235) · aperçu carte retiré (location stamp) (03-01 nav Stack+(tabs) · 03-02 tap-pin → détail direct · 03-03 création carnet note-first · 03-04 détail carnet lecture + segments date #2125 · 03-05 validation device + correctifs sheet) |
| 4 | Listes & Cercle | 🔄 Code complet — 3/3 plans · 04-01 (UI-05) + 04-02 (UI-06) + 04-03 (UI-07) exécutés, gate device en attente |
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

**Phase 4 code complet — 04-01 (UI-05) + 04-02 (UI-06) + 04-03 (UI-07) exécutés.** Prochaine étape : **gate device de fin de phase** (build natif EAS — l'orchestrateur le lance) puis vérification 3/3. Baseline tsc de référence phase 4 = **21** ; 04-03 a fini à 21 (0 nouvelle erreur). respondToTag ajouté à useFriends (mono-table point_partners, is_visible via trigger). Déviation rule-4 existante `handleCancel` (Envoyées) laissée inchangée et documentée (non étendue).

Aperçu carte **restauré build #27** (validé device) : `<Image>` statique Mapbox (`mapboxStaticUrl()`) + pin rose RN, dans détail + création — fiable dans le `modal` (le noir d'avant venait du `formSheet`, pas de l'image).

**Cycle de correctifs sheet (builds #20→#26), révélé par la validation device :**

- #20–#22 : contenu « noir en haut ». Fausse piste « carte noire ».
- Aperçu carte retiré (MapView GL **et** `<Image>` Mapbox rendent noir dans un sheet) → location stamp (création) / adresse en métadonnées (détail).
- #24 : layout (suppression `KeyboardAvoidingView`, `contentInsetAdjustmentBehavior="never"`, `automaticallyAdjustKeyboardInsets`). Insuffisant.
- #25 : taille explicite `useWindowDimensions` (workaround #2522) → a **empiré** (sheet entièrement noir, contenu hors écran).
- **#26 ✅ cause racine** : `formSheet` (détents custom) cassé sur **iOS 26 + react-native-screens 4.16** ([#3235](https://github.com/software-mansion/react-native-screens/issues/3235), contenu ancré en bas, non corrigé jusqu'à 4.20+, non corrigeable JS) → bascule vers **`presentation: 'modal'`** (carte pageSheet native, swipe-dismiss conservé) qui rend correctement. Validé device.

## Session

- **Stopped at:** Phase 4 plan 04-03 exécuté (UI-07). useFriends.respondToTag ajouté (mono-table point_partners, is_visible via trigger, RLS mig 010/011) ; FriendRequestItem boutons texte paramétrés (Accepter/Refuser · Sceller/Décliner, coral/ghost, D-12) + nom serif 20, IcoCheck/IcoClose retirés ; friends/requests refondu (2 sections eyebrow + Envoyées discrète, taguage consenti inline via respondToTag sans navigation, empty « Pas de page en attente. », titre serifLight 36, F.sans* purgé). W2 corrigé (refus amitié haptics.tap→warn). handleCancel (Envoyées) rule-4 laissé inchangé + documenté. 0 nouvelle erreur tsc (21). Vérif device en attente.
- **Resume file:** .planning/phases/04-listes-cercle/ (execute-phase — gate device de fin de phase)

---
*Last updated: 2026-06-02 after 04-03 (UI-07 Demandes — 2 sections eyebrow + consentement taguage inline respondToTag, 0 nouvelle erreur tsc)*

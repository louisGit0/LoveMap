# Roadmap: LoveMap — Refonte UI/UX iOS

**Created:** 2026-05-29
**Mode:** MVP vertical · **Granularity:** Standard · **Phases:** 5

Chaque phase livre une tranche visible bout-en-bout. Les fondations techniques sont posées d'abord car elles conditionnent tout le reste et portent le principal risque TestFlight.

---

### Phase 1: Stabilisation & Fondations ✅ COMPLETE
**Status:** ✅ Terminé et vérifié (8/8 requirements, gsd-verifier PASS) — validé device sur builds #17 (worklets) et #18 (avatar). Régressions #15/#16 corrigées : migrations 011 (RLS 42P17) + 012 (RLS Storage avatars), expo-image-picker 16→17, expo-file-system legacy.
**Goal:** Sécuriser la base technique de la refonte et confirmer que les bugs des builds #15/#16 sont réglés sur TestFlight.
**Mode:** mvp
**Requirements:** STAB-01, STAB-02, STAB-03, FOND-01, FOND-02, FOND-03, FOND-04, IOS-03
**Success Criteria**:
1. Sur TestFlight : la photo de profil s'ouvre sans crash, les pins restent visibles au dézoom, et le partenaire tagué voit/accepte le taguage.
2. `app.json` est passé en `runtimeVersion: { policy: "fingerprint" }` et un build natif est produit.
3. `react-native-reanimated` v4 + `react-native-gesture-handler` sont installés, l'app démarre avec un `GestureHandlerRootView` racine et aucun gesture mort.
4. `lib/haptics.ts` existe et déclenche le bon feedback sur les actions existantes (création, consentement, navigation, suppression).
5. Le composant `AppText` borne le Dynamic Type et est prêt à remplacer les `Text` dans les écrans refondus.

**Plans:** 4/4 plans complete
- [x] 01-01-PLAN.md — Checklist de validation STAB-01/02/03 sur TestFlight (#15/#16)
- [x] 01-02-PLAN.md — Primitives JS : lib/haptics.ts + composant AppText (Dynamic Type borné)
- [x] 01-03-PLAN.md — Câblage haptique des actions clés existantes (IOS-03) + centralisation expo-haptics
- [x] 01-04-PLAN.md — Socle natif (reanimated v4 + gesture-handler + GestureHandlerRootView), runtimeVersion fingerprint, build #17

### Phase 2: Carte stylisée ✅ COMPLETE
**Status:** ✅ Terminé et vérifié (4/4, gsd-verifier PASS) — validé device sur build #19. Style Mapbox Studio custom + heatmap rose→ambre + markers raffinés/animés + bandeau éditorial + pivot iOS arrondi (D-12).
**Goal:** Transformer l'écran carte en surface éditoriale signature (style sur-mesure, heatmap raffinée, markers retravaillés).
**Mode:** mvp
**Requirements:** MAP-01, MAP-02, MAP-03, UI-02
**Success Criteria**:
1. La carte affiche un style Mapbox sur-mesure noir/rose avec labels minimalistes, injecté via `EXPO_PUBLIC_MAPBOX_STYLE`.
2. La heatmap utilise un dégradé rose→ambre et atténue son opacité aux zooms élevés.
3. Les markers ont un design retravaillé avec état sélectionné et animation d'apparition.
4. L'écran carte et son FAB sont refondus dans l'esprit éditorial (contrôles flottants, FAB non-Material) avec haptics au tap.

**Plans:** 5/5 plans complete
- [x] 02-01-PLAN.md — Pivot tokens de rayon D-12 (theme.ts) + révision CLAUDE.md §Identité visuelle
- [x] 02-02-PLAN.md — Heatmap rose→ambre + opacité décroissante au zoom (MAP-02)
- [x] 02-03-PLAN.md — Markers raffinés + sélection + cascade + FAB squircle animé (MAP-03, UI-02)
- [x] 02-04-PLAN.md — Bandeau de contrôles éditorial + sélecteur d'ami + recentrer (UI-02)
- [x] 02-05-PLAN.md — Style Mapbox Studio sur-mesure (checkpoint humain, MAP-01)

### Phase 3: Création & Détail de point (sheets natifs)
**Goal:** Faire vivre le flux cœur (créer / consulter un moment) dans de vraies bottom sheets iOS, archétype « page de carnet ».
**Mode:** mvp
**Requirements:** IOS-01, IOS-02, UI-03, UI-04
**Success Criteria**:
1. La création de point s'ouvre dans un bottom sheet natif à détentes (poignée, swipe-to-dismiss, detents ≥ 0.7).
2. Le détail de point s'affiche en sheet/route native avec swipe-back fonctionnel.
3. Les `Modal` custom de ce flux sont migrés vers des routes Stack (`gestureEnabled`).
4. Les écrans création et détail suivent l'archétype « page de carnet » (N°00X, note serif géante, pull-quote italic).

**Plans:** 5/5 plans executed — ✅ **Phase terminée, validée device (#26)**
- [x] 03-01-PLAN.md — Restructuration nav : (app) Stack + groupe (tabs) + routes sheet (point/new, point/[id]) (IOS-01, IOS-02)
- [x] 03-02-PLAN.md — Suppression Modal PointMarker + tap-pin → détail direct + nettoyage map/index (IOS-02)
- [x] 03-03-PLAN.md — Refonte création « page de carnet » (note d'abord) + clavier sheet + garde D-04 (UI-03, IOS-01)
- [x] 03-04-PLAN.md — Refonte détail « page de carnet » + segments date (anti-freeze #2125) + dismiss natif (UI-04, IOS-02, IOS-01)
- [x] 03-05-PLAN.md — Gate device : gates statiques + builds #20→#26 + validation TestFlight iOS 26 (IOS-01, IOS-02, UI-03, UI-04)

> **Pivot device (#26)** : le `formSheet` (détents custom) est cassé sur **iOS 26 + react-native-screens 4.16** ([#3235](https://github.com/software-mansion/react-native-screens/issues/3235) — contenu ancré en bas = sheet noir, non corrigé jusqu'à 4.20+, non corrigeable JS). Critère 1 satisfait via **`presentation: 'modal'`** (carte pageSheet native : glisse du bas, swipe-to-dismiss) plutôt que `formSheet`. Aperçu carte des sheets retiré (MapView GL & `<Image>` Mapbox rendent noir en sheet) → cartouche de lieu / adresse en métadonnées.

### Phase 4: Listes & Cercle
**Goal:** Refondre les écrans de listing et social selon l'archétype « table des matières ».
**Mode:** mvp
**Requirements:** UI-05, UI-06, UI-07
**Success Criteria**:
1. La liste des moments (`point/list`) adopte l'archétype « table des matières » (gros numéros, métadonnées mono alignées droite) avec swipe-back.
2. L'écran amis (`friends/index`) est refondu dans le même archétype, filtres/recherche inclus.
3. L'écran demandes (`friends/requests`) est refondu, taguages en attente et demandes d'amitié lisibles et cohérents.

### Phase 5: Auth, Profil & Finitions
**Goal:** Refondre les écrans « page de couverture » et finaliser la cohérence iOS transverse (safe areas, Dynamic Type).
**Mode:** mvp
**Requirements:** UI-01, UI-08, IOS-04
**Success Criteria**:
1. Les écrans login + register sont refondus selon l'archétype « page de couverture ».
2. L'écran profil est refondu selon le même archétype (avatar carré, stats, analyse).
3. Tous les écrans refondus respectent safe areas, home indicator et Dynamic Type sans casse, en thèmes clair et sombre.
4. Une passe finale confirme cohérence visuelle et absence de régression sur l'ensemble des 9 écrans.

---

## Coverage

Tous les requirements v1 sont mappés à exactement une phase.

| Phase | Requirements | Count |
|-------|--------------|-------|
| 1 | STAB-01, STAB-02, STAB-03, FOND-01, FOND-02, FOND-03, FOND-04, IOS-03 | 8 |
| 2 | MAP-01, MAP-02, MAP-03, UI-02 | 4 |
| 3 | IOS-01, IOS-02, UI-03, UI-04 | 4 |
| 4 | UI-05, UI-06, UI-07 | 3 |
| 5 | UI-01, UI-08, IOS-04 | 3 |

**Total :** 22 / 22 requirements mappés ✓

---
*Last updated: 2026-06-02 after 03-02 (PointMarker Modal removal + tap-pin → detail direct, IOS-02/D-06)*

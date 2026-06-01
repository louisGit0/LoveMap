# Requirements: LoveMap — Refonte UI/UX iOS

**Defined:** 2026-05-29
**Core Value:** L'expérience visuelle et tactile doit donner l'impression d'un produit iOS premium et intentionnel, en restant belle, fluide et stable sur iPhone.

## v1 Requirements

Requirements pour ce cap (stabilisation + refonte UI/UX). Chacun mappé à une phase de la roadmap.

### Stabilisation

- [ ] **STAB-01**: Confirmer sur TestFlight que le crash à l'ouverture de la galerie photo de profil est réglé (#15)
- [ ] **STAB-02**: Confirmer sur TestFlight que les points restent visibles à tous les niveaux de dézoom (#16)
- [ ] **STAB-03**: Confirmer sur TestFlight que le partenaire tagué voit bien le taguage en attente et peut consentir (#16)

### Fondations techniques

- [ ] **FOND-01**: `app.json` utilise la politique `runtimeVersion: { policy: "fingerprint" }` pour éviter les crashs TestFlight lors d'OTA après ajout natif
- [ ] **FOND-02**: `react-native-reanimated` v4 et `react-native-gesture-handler` sont installés (New Architecture) avec un unique `GestureHandlerRootView` à la racine
- [ ] **FOND-03**: Un helper `lib/haptics.ts` centralise les retours haptiques avec un mapping action→feedback (selection / impact / notification)
- [ ] **FOND-04**: Un composant `AppText` applique le Dynamic Type borné (`maxFontSizeMultiplier` par variant) et remplace les `Text` bruts dans l'UI refondue

### Carte & points

- [ ] **MAP-01**: La carte utilise un style Mapbox sur-mesure noir/rose (créé via Mapbox Studio, injecté via `EXPO_PUBLIC_MAPBOX_STYLE`) avec labels minimalistes
- [ ] **MAP-02**: La heatmap utilise un dégradé rose→ambre cohérent avec l'identité, avec opacité décroissante aux zooms élevés
- [x] **MAP-03**: Les markers de points ont un design retravaillé avec état sélectionné et animation d'apparition (sur `PointAnnotation`)

### Patterns iOS natifs

- [ ] **IOS-01**: La création et le détail de point s'affichent dans des bottom sheets natifs à détentes (`presentation: 'formSheet'`, poignée, swipe-to-dismiss, detents ≥ 0.7)
- [ ] **IOS-02**: La navigation utilise le swipe-back natif (migration des `Modal` custom vers des routes Stack avec `gestureEnabled`)
- [ ] **IOS-03**: Les actions clés (création de point, consentement, navigation, suppression) déclenchent un retour haptique approprié
- [ ] **IOS-04**: Tous les écrans respectent parfaitement les safe areas, le home indicator et le Dynamic Type sans casse de layout

### Refonte des écrans (esprit éditorial × iOS)

- [ ] **UI-01**: Les écrans d'authentification (login + register) sont refondus selon l'archétype « page de couverture »
- [ ] **UI-02**: L'écran carte + FAB est refondu (contrôles flottants éditoriaux, FAB non-Material)
- [ ] **UI-03**: L'écran de création de point (`point/new`) est refondu selon l'archétype « page de carnet » dans un bottom sheet natif
- [ ] **UI-04**: L'écran de détail de point (`point/[id]`) est refondu selon l'archétype « page de carnet »
- [ ] **UI-05**: L'écran liste des moments (`point/list`) est refondu selon l'archétype « table des matières »
- [ ] **UI-06**: L'écran amis (`friends/index`) est refondu selon l'archétype « table des matières »
- [ ] **UI-07**: L'écran demandes (`friends/requests`) est refondu selon l'archétype « table des matières »
- [ ] **UI-08**: L'écran profil (`profile/index`) est refondu selon l'archétype « page de couverture »

## v2 Requirements

Reporté à un cap futur. Suivi mais hors roadmap actuelle.

### Carte

- **MAP-V2-01**: Clustering des points proches au dézoom (bulles avec compteur, tap-to-zoom) — nécessite migration `PointAnnotation` → `ShapeSource`/`CircleLayer`, item le plus risqué (quirks iOS @rnmapbox #1746/#2001), reporté pour réduire le risque de ce cap

## Out of Scope

Exclusions explicites. Documentées pour éviter le scope creep.

| Feature | Reason |
|---------|--------|
| Nouvelles fonctionnalités produit (chat, partage public, groupes) | Ce cap est stabilisation + UI/UX uniquement |
| Support Android natif | iOS prioritaire, web reste un stub |
| Refonte backend / schéma Supabase | La base est stable ; on ne touche aux migrations que si nécessaire |
| iOS natif pur (SF Symbols, composants système) | On garde l'identité éditoriale, on l'hybride seulement |
| `@gorhom/bottom-sheet` | Le formSheet natif Expo Router suffit ; compat SDK 54 instable |
| Abandon mode clair/sombre | Les deux thèmes restent supportés |

## Traceability

Quelles phases couvrent quels requirements. Rempli pendant la création de la roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| STAB-01 | Phase 1 | Pending |
| STAB-02 | Phase 1 | Pending |
| STAB-03 | Phase 1 | Pending |
| FOND-01 | Phase 1 | Pending |
| FOND-02 | Phase 1 | Pending |
| FOND-03 | Phase 1 | Pending |
| FOND-04 | Phase 1 | Pending |
| IOS-03 | Phase 1 | Pending |
| MAP-01 | Phase 2 | Pending |
| MAP-02 | Phase 2 | Pending |
| MAP-03 | Phase 2 | Complete |
| UI-02 | Phase 2 | Pending |
| IOS-01 | Phase 3 | Pending |
| IOS-02 | Phase 3 | Pending |
| UI-03 | Phase 3 | Pending |
| UI-04 | Phase 3 | Pending |
| UI-05 | Phase 4 | Pending |
| UI-06 | Phase 4 | Pending |
| UI-07 | Phase 4 | Pending |
| UI-01 | Phase 5 | Pending |
| UI-08 | Phase 5 | Pending |
| IOS-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-29*
*Last updated: 2026-05-29 after initial definition*

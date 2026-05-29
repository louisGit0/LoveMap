# LoveMap

## What This Is

LoveMap est une application mobile iOS (React Native / Expo) pour adultes qui permet de poser des points géolocalisés sur les lieux où l'on a eu un rapport sexuel, de les annoter (note /10, commentaire, durée, date), de les visualiser en carte et heatmap, et de les partager uniquement avec des amis approuvés via un système de consentement double (le partenaire tagué doit accepter pour qu'un point devienne visible).

Ce cap (milestone) ne crée pas de nouvelles fonctionnalités produit : il **stabilise** l'app après les builds TestFlight #15/#16 et **refond l'UI/UX** dans une direction éditoriale × iOS hybride, en commençant par la carte.

## Core Value

L'expérience visuelle et tactile doit donner l'impression d'un produit iOS premium et intentionnel — la carte stylisée et les écrans refondus sont ce qui distingue LoveMap d'une app générique. Si tout le reste échoue, l'app doit rester belle, fluide et stable sur iPhone.

## Requirements

### Validated

<!-- Capacités déjà livrées et confirmées par le code existant (builds 1→16). -->

- ✓ Authentification email/mot de passe avec age-gate ≥ 18 ans (côté client + trigger SQL) — existant
- ✓ Inscription en 2 étapes (âge → formulaire) — existant
- ✓ Carte interactive Mapbox (@rnmapbox/maps) avec géolocalisation utilisateur — existant
- ✓ Création de point via RPC PostGIS `create_point` (note, commentaire, durée, date, adresse) — existant
- ✓ Affichage des points sur la carte (PointAnnotation, visible à tout zoom — build #16) — existant
- ✓ Heatmap des points — existant
- ✓ Système d'amis (recherche, demandes, acceptation, suppression) — existant
- ✓ Taguage partenaire + consentement double (point visible uniquement après acceptation, trigger SQL) — existant
- ✓ Section taguages en attente côté partenaire (build #16) — existant
- ✓ Notifications push (Expo Push API) au taguage — existant
- ✓ Profil : avatar upload, édition prénom, stats, analyse (distribution notes, top mois, durée) — existant
- ✓ Changement email / mot de passe / suppression de compte — existant
- ✓ Mode sombre / clair (themeStore persisté) — existant
- ✓ Design éditorial noir/rose (Cormorant italique + Inter Tight + JetBrains Mono) — existant
- ✓ RLS active sur toutes les tables, secrets via EAS — existant

### Active

<!-- Scope de ce cap : stabilisation + refonte UI/UX. -->

**Stabilisation**
- [ ] Vérifier sur TestFlight que le crash photo de profil est réglé (#15)
- [ ] Vérifier sur TestFlight que les pins restent visibles au dézoom (#16)
- [ ] Vérifier sur TestFlight que la mention partenaire apparaît côté testeur tagué (#16)

**Carte & points**
- [ ] Style Mapbox sur-mesure (palette noir/rose, labels minimalistes)
- [ ] Clustering des points proches au dézoom (bulles avec compteur)
- [ ] Heatmap raffinée (dégradé cohérent avec l'identité rose/chaleur)
- [ ] Markers retravaillés (état sélectionné, apparition)

**Refonte des écrans (9)**
- [ ] Refonte des écrans d'authentification (login, register)
- [ ] Refonte de l'écran carte + FAB
- [ ] Refonte création de point (point/new)
- [ ] Refonte détail de point (point/[id])
- [ ] Refonte liste des moments (point/list)
- [ ] Refonte écran amis (friends/index)
- [ ] Refonte écran demandes (friends/requests)
- [ ] Refonte profil (profile/index)

**Patterns iOS natifs**
- [ ] Bottom sheets à détentes (detents, poignée, swipe-to-dismiss) pour création/détail de point
- [ ] Gestes & transitions natifs (swipe-back, transitions fluides entre écrans)
- [ ] Haptics riches sur les actions clés (création, consentement, navigation)
- [ ] Respect parfait des safe areas, home indicator et Dynamic Type

### Out of Scope

- Nouvelles fonctionnalités produit (chat, partage public, groupes) — ce cap est stabilisation + UI/UX uniquement
- Support Android natif — l'app cible iOS en priorité ; le web reste un stub
- Refonte du backend / schéma Supabase — la base est stable, on ne touche qu'aux migrations nécessaires (clustering éventuel)
- iOS natif pur (SF Symbols, composants système) — on garde l'identité éditoriale, on l'hybride seulement
- Abandon du mode clair/sombre — les deux thèmes restent supportés

## Context

**État du code :** Application mature (builds EAS #1→#16, soumis à TestFlight). Architecture Expo Router file-based, Zustand pour le state, hooks pour tous les accès Supabase (jamais d'appel direct dans les composants), design tokens centralisés dans `constants/theme.ts` et `constants/fonts.ts`.

**Pièges connus (confirmés en production) :**
- `expo-image-picker` et `expo-file-system` DOIVENT être importés en `require` dynamique à l'intérieur de la fonction — l'import statique crashe l'onglet natif iOS sans message.
- `requestMediaLibraryPermissionsAsync()` est interdit (crash natif iOS 14+) — `launchImageLibraryAsync()` se suffit via PHPickerViewController.
- `MarkerView` disparaissait au dézoom → migré vers `PointAnnotation` (#16). Le clustering devra rester compatible avec ce choix.
- Création de point uniquement via RPC `create_point` (jamais d'insert direct avec WKT côté client).
- Migrations 009 et 010 à appliquer manuellement dans Supabase Dashboard avant tests.

**Workflow obligatoire après chaque modif :** `git push origin master` + `eas update --branch main` (ou build natif si modules natifs touchés). Les OTA ne s'appliquent pas chez l'utilisateur → privilégier les builds natifs pour les changements impactant le natif.

## Constraints

- **Tech stack** : React Native + Expo SDK 54, TypeScript strict, Expo Router v6, Supabase v2, @rnmapbox/maps 10.3.1, Zustand v4 — ne pas dévier
- **Plateforme** : iOS prioritaire (TestFlight), web en stub uniquement
- **Design** : tokens via `theme.ts` / `fonts.ts` — jamais de couleur ou fontFamily hardcodée ; aucun emoji dans l'UI ; icônes SVG custom (`components/icons.tsx`), pas de @expo/vector-icons
- **Langue** : toute l'interface en français, ton éditorial intime ("Sceller la page", "le cercle", "Zone irréversible")
- **Sécurité** : RLS jamais désactivée, jamais de service key côté client, consentement géré par trigger SQL (aucun bypass)
- **Distribution** : builds via EAS, secrets via EAS env/secrets uniquement (jamais hardcodés)
- **Performance** : animations sur propriétés compositor-friendly (transform/opacity), pas de churn sur les handlers de scroll

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Garder l'identité éditoriale, l'hybrider avec iOS | L'identité noir/rose est un différenciateur fort ; le marier aux patterns iOS donne un feeling premium sans perdre le caractère | — Pending |
| Commencer la refonte par la carte | C'est l'écran central et le point de départ explicite de l'utilisateur | — Pending |
| Style Mapbox sur-mesure via Studio | Le style dark-v11 standard ne colle pas à l'identité éditoriale | — Pending |
| Clustering plutôt que markers signature individuels | Priorité donnée à la lisibilité au dézoom plutôt qu'au marker individuel riche | — Pending |
| Bugs en mode léger (vérification, pas chasse) | #15/#16 corrigent déjà les bugs connus ; reste à confirmer sur TestFlight | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-29 after initialization*

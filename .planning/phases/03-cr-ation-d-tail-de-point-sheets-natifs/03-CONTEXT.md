# Phase 3: Création & Détail de point (sheets natifs) - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Faire vivre le flux cœur (créer / consulter un moment) dans de vraies bottom sheets iOS natives, archétype « page de carnet », avec gestes natifs. Refonte de **présentation** : la logique métier (partenaire obligatoire, RPC `create_point`, consentement `is_visible`, suppression, date saisie) est PRÉSERVÉE.

**Couvre :** IOS-01 (bottom sheets natifs `formSheet` : poignée, swipe-to-dismiss, détents ≥ 0.7), IOS-02 (swipe natif via migration des Modal custom → routes Stack), UI-03 (`point/new` archétype « page de carnet »), UI-04 (`point/[id]` archétype « page de carnet »).

**Hors scope :** refonte des écrans liste/cercle (Phase 4), auth/profil (Phase 5), `@gorhom/bottom-sheet` (REQUIREMENTS Out of Scope — on utilise le form sheet natif Expo Router), migration des autres bottom-sheets (FiltersBottomSheet, FriendSelector) — différée.
</domain>

<decisions>
## Implementation Decisions

### Sheets natifs (IOS-01)
- **D-01:** **Form sheet natif Expo Router** (`react-native-screens`, `presentation: 'formSheet'`) — **zéro nouvelle dépendance**. `@gorhom/bottom-sheet` écarté (REQUIREMENTS, bugs compat SDK 54). Recherche projet : recommandation explicite du form sheet natif (`.planning/research/ARCHITECTURE.md §Bottom Sheets`).
- **D-02:** **Grand détent unique (~0.9)** pour création ET détail (respecte ≥ 0.7). Pas de détent medium (le formulaire de création est long).
- **D-03:** Poignée iOS visible (`sheetGrabberVisible`), coins arrondis natifs iOS. On n'applique PAS de `borderRadius` forcé au conteneur du sheet (chrome natif) — c'est cohérent avec le pivot D-12 (formes iOS arrondies). L'identité éditoriale s'applique À L'INTÉRIEUR (typo, couleurs, eyebrows).
- **D-04:** Fermeture par swipe — **confirmation « Abandonner ce moment ? » si une saisie est non vide** (création) ; fermeture directe sinon. Le détail (lecture) se ferme directement.

### Navigation (IOS-02)
- **D-05:** Migrer `point/new` et `point/[id]` de `Tabs.Screen` cachés (`href: null`, écrans pleins actuels) → **Stack form-sheets natifs**. Restructuration : un Stack parent contenant les tabs + les routes sheet (pattern Expo Router standard — détail technique laissé au researcher/planner ; voir ARCHITECTURE.md).
- **D-06:** **Tap sur un pin de la carte → ouvre directement le sheet de détail natif.** La **Modal d'aperçu custom dans `components/map/PointMarker.tsx` est SUPPRIMÉE** (migration Modal custom → route native, cœur de IOS-02). Le `onSelected` du `PointAnnotation` navigue vers la route détail.
- **D-07:** **Logique métier intacte** : partenaire obligatoire (CTA bloqué si aucun), `supabase.rpc('create_point')`, consentement partenaire (`is_visible` via trigger), suppression, date saisie JJ/MM/AAAA. Phase 3 = refonte visuelle + présentation native, AUCUN changement de flux métier ni de DB.

### Page de carnet (UI-03 / UI-04)
- **D-08:** Carnet **suggéré / sobre** — porté par la typographie (note serif géante, commentaire en pull-quote italic entre guillemets, N°00X en mono) + la hiérarchie. **Pas de skeuomorphisme** (ni texture/grain papier, ni lignes de cahier). Cohérent avec le design system éditorial.
- **D-09:** Création et détail = **deux traitements distincts** (PAS un gabarit partagé) : création optimisée pour la **saisie structurée** (champs clairs), détail optimisé pour la **lecture éditoriale**.
- **D-10:** La **page de création s'ouvre sur la NOTE** (serif géant en haut = geste d'écriture central), puis partenaire / commentaire / durée / date plus bas.

### Claude's Discretion
- Gestion clavier + scroll interne dans le sheet à grand détent (KeyboardAvoidingView + ScrollView ; le sheet natif ne se redimensionne pas au clavier — scroll interne).
- Composition fine des pages, place des métadonnées, emplacement des boutons d'action (sceller / consentir / supprimer) dans le sheet — à figer en UI-SPEC.
- Détent exact (0.9 vs 0.95), `sheetCornerRadius`, visibilité fine de la poignée.
- Mode édition dans le sheet de détail + gestion des photos : comportement existant conservé sauf décision UI-SPEC.
- Sort des autres points d'entrée de création (FAB carte + long-press carte) : conservés, ouvrent le même sheet.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cadre phase & requirements
- `.planning/ROADMAP.md` §Phase 3 — goal + success criteria.
- `.planning/REQUIREMENTS.md` — IOS-01, IOS-02, UI-03, UI-04 (+ Out of Scope : `@gorhom/bottom-sheet`).
- `.planning/phases/01-stabilisation-fondations/01-CONTEXT.md` — haptics, AppText.
- `.planning/phases/02-carte-stylis-e/02-CONTEXT.md` §D-12 — pivot iOS arrondi (le chrome natif du sheet s'y aligne).

### Recherche iOS (cap UI/UX)
- `.planning/research/ARCHITECTURE.md` §Bottom Sheets — comparatif 3 options + **config concrète du form sheet natif** (`presentation:'formSheet'`, `sheetAllowedDetents`, `sheetGrabberVisible`) + §Gestures/swipe-back. LECTURE OBLIGATOIRE.
- `.planning/research/PITFALLS.md` — pièges sheets / SDK 54 / New Architecture.
- `.planning/research/SUMMARY.md` — synthèse sheets natifs.

### Design system
- `.planning/phases/02-carte-stylis-e/02-UI-SPEC.md` — langage de formes D-12, tokens de rayon.
- `constants/theme.ts` (tokens radius), `constants/fonts.ts` (F), `CLAUDE.md` §Identité visuelle.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/(app)/_layout.tsx` — **Tabs** navigator ; `point/new` et `point/[id]` y sont des `Tabs.Screen` avec `href: null` (écrans pleins cachés). Cible de la migration D-05 vers Stack form-sheets.
- `app/(app)/point/new.tsx` — formulaire de création (partenaire obligatoire, note, commentaire, durée, date JJ/MM/AAAA, GPS) ; `handleSubmit` → `createPoint` (RPC) ; haptics déjà câblés (Phase 1). À restyler en page de carnet (note d'abord, D-10) dans un sheet.
- `app/(app)/point/[id].tsx` — détail + `handleConsent` (sceller/refuser) + `handleDelete` + mode édition `handleSaveAndAccept` ; haptics câblés. À restyler en page de carnet (lecture) dans un sheet.
- `components/map/PointMarker.tsx` — `PointAnnotation` + **Modal d'aperçu custom à SUPPRIMER (D-06)** ; `onSelected` doit naviguer vers la route détail.
- `lib/haptics.ts`, `components/ui/AppText.tsx`, `components/ui/PageHeader.tsx`, `components/ui/Button.tsx` — primitives réutilisables.
- Tokens de rayon `T.radiusXs..Xl` (Phase 2 / D-12) pour les éléments internes des sheets.

### Established Patterns
- `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);`
- `useSafeAreaInsets()` (jamais SafeAreaView) ; polices `F.xxx` ; icônes SVG custom `components/icons.tsx`.
- `haptics.press()` (action importante), `haptics.success()` (sceller), `haptics.warn()` (suppression/refus).
- Snackbar React Native Paper pour les erreurs.

### Integration Points
- Restructuration du routing `(app)` : Stack parent + tabs + routes sheet (`point/new`, `point/[id]`).
- `components/map/PointMarker.tsx` `onSelected` → `router.push('/(app)/point/[id]')` (suppression de la Modal).
- Entrées de création existantes (FAB carte `handleFabPress`, long-press carte `handleLongPress`) → ouvrent le sheet de création.

</code_context>

<specifics>
## Specific Ideas

- Esprit « journal intime » : sceller une page, relire une page. Le détail = on RELIT le moment (lecture posée), la création = on INSCRIT (la note d'abord, geste central).
- Chrome natif iOS assumé (poignée + coins arrondis) ; l'éditorial vit à l'intérieur du sheet.
- Le tap-pin direct vers le détail renforce l'immédiateté (« je touche le moment, il s'ouvre »).

</specifics>

<deferred>
## Deferred Ideas

- Migration de `FiltersBottomSheet` et `FriendSelector` en sheets natifs — listés par la recherche comme candidats, mais hors périmètre Phase 3 (Phase 4 ou ultérieur).
- Carnet **texturé/skeuomorphique** (numéro de page, grain papier, lignes de cahier) — écarté au profit du carnet suggéré/sobre (D-08).
- Refonte de la gestion des photos du point — conservée telle quelle sauf décision UI-SPEC.

None autres — discussion restée dans le périmètre (sheets + refonte création/détail).

</deferred>

---

*Phase: 3-cr-ation-d-tail-de-point-sheets-natifs*
*Context gathered: 2026-06-01*

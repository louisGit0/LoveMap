# Phase 2: Carte stylisée - Context

**Gathered:** 2026-06-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Transformer l'écran carte en surface éditoriale signature : style Mapbox sur-mesure noir/rose, heatmap raffinée rose→ambre, markers retravaillés (état sélectionné + animation), et refonte des contrôles flottants + FAB.

**Couvre :** MAP-01 (style Mapbox sur-mesure), MAP-02 (heatmap rose→ambre), MAP-03 (markers retravaillés), UI-02 (écran carte + FAB refondus).

**Hors scope :** clustering des points (reporté v2 — MAP-V2-01), refonte des bottom sheets de détail (Phase 3, IOS-01), refonte des autres écrans (Phases 3-5). La preview au tap d'un marker reste en l'état (Modal custom existant) — les sheets natifs sont en Phase 3.
</domain>

<decisions>
## Implementation Decisions

### Style Mapbox sur-mesure (MAP-01)
- **D-01:** Carte **sombre mais lisible** — rues et labels restent visibles mais en sombre/désaturé, pour qu'on se repère dans sa ville. Pas un décor totalement effacé. Densité de labels : grandes artères + quartiers/villes conservés, labels mineurs retirés.
- **D-02:** **Touches rose subtiles sur la carte elle-même** — ex. l'eau ou les grands axes teintés d'un rose très désaturé (signature), sans noyer les points. Le rose vif (#ff2d87) reste majoritairement réservé aux markers/heatmap.
- **D-03:** **Fond anthracite quasi-noir** (proche de T.bg #000) comme teinte de base de la carte, pour le contraste maximal (pas le bleu nuit #0d1a2e).
- **D-04:** **Production du style : Claude fournit une spec Studio précise → l'utilisateur la reproduit dans Mapbox Studio et fournit l'URL `mapbox://styles/...`** à injecter dans `EXPO_PUBLIC_MAPBOX_STYLE`. Le code ne fait que pointer vers l'URL (déjà câblé via `APP_CONFIG.MAPBOX_STYLE`). La création du style dans Studio est une étape MANUELLE utilisateur (dépendance externe, type checkpoint humain).

### Markers (MAP-03)
- **D-05:** **Raffiner le pin actuel** (tête ronde à bord rose + tige) — proportions soignées, halo rose léger, bord plus net. Continuité avec l'existant, pas de nouvelle forme.
- **D-06:** **État sélectionné = agrandissement + halo rose** (au tap, avant d'ouvrir la preview).
- **D-07:** **Animation d'apparition = pop/scale-up en cascade** (scale + fade depuis 0, léger stagger). **Repli = fondu simple** si la recherche montre que PointAnnotation (snapshot natif) ne permet pas le scale proprement. reanimated v4 dispo (Phase 1).

### Heatmap (MAP-02)
- **D-08:** **Dégradé rose→ambre où l'ambre = forte concentration** (basé sur `heatmap-density`) : peu de points = rose, zones où beaucoup de moments se superposent = ambre chaud lumineux. (Remplace l'actuel violet→#e91e8c→orange-rouge.)
- **D-09:** **Opacité décroissante au zoom proche → atténuation en lueur douce** : au zoom proche, la heatmap baisse en opacité pour devenir une lueur diffuse (on voit la carte stylisée dessous), pas un aplat coloré ni une disparition totale. (Rappel : toggle pins/heatmap mutuellement exclusifs — en mode heatmap, pas de pins.)

### Contrôles flottants + FAB (UI-02)
- **D-10:** **Bandeau de contrôles éditorial repensé** — redessiner les contrôles flottants (toggle pins/heatmap, sélecteur d'ami, bouton Recentrer) en un bandeau/cluster flottant plus signature (hiérarchie forte, typo mono/serif). Note readability : la leçon CLAUDE.md règle 13 (BlurView a nui à la lisibilité de la tab bar) s'applique — préférer des surfaces semi-opaques lisibles à un blur lourd.
- **D-11:** **Haptic `press()` (impact medium) au tap du FAB** (ouverture création = action importante, D-02 Phase 1) + micro-animation au tap. Le FAB n'a aucun haptic aujourd'hui.

### Pivot design — formes iOS arrondies (DÉCISION TRANSVERSALE, Phases 2→5)
- **D-12 (IMPORTANT, cross-phase):** **Abandon des « angles francs » (borderRadius 0) au profit de formes iOS arrondies (squircle / rayon continu) sur toute la refonte (Phases 2→5).** Nouvelle direction assumée : **« éditorial sombre + formes iOS arrondies »**. Le **FAB n'est plus carré** : il devient une forme arrondie iOS (rond ou squircle — forme exacte + échelle de rayons à VERROUILLER dans un UI-SPEC via `/gsd:ui-phase 2`). Le design system doit être révisé en conséquence : tokens de rayon dans `constants/theme.ts` (`T.cardRadius` actuellement = 4 / angles francs) ET les conventions « angles francs / borderRadius:0 » de `CLAUDE.md` (section Identité visuelle). Cette révision démarre en Phase 2 (carte) et s'applique aux phases suivantes.
  - **Impact downstream :** le planner doit traiter la mise à jour des tokens de rayon (theme.ts) + CLAUDE.md comme une tâche de la Phase 2, et appliquer les coins arrondis aux nouveaux contrôles carte + FAB. L'échelle de rayons précise et la forme du FAB sont à figer en UI-SPEC avant l'implémentation.

### Claude's Discretion
- Valeurs hex exactes du dégradé heatmap (rose de départ ≈ #ff2d87, ambre d'arrivée ≈ ambre chaud type #ffb020 — à affiner) et la courbe d'opacité par zoom.
- Détails de la spec Mapbox Studio (hex par calque fond/eau/routes/labels, intensité des touches rose désaturées).
- Mapping haptique fin des autres contrôles carte (toggle, recentrer) — `tap()`/`select()` selon l'intention.
- Forme exacte du FAB (rond vs squircle) et l'échelle de rayons iOS — à verrouiller en UI-SPEC, Claude propose.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Cadre phase & requirements
- `.planning/ROADMAP.md` §Phase 2 — goal + 4 success criteria de la phase.
- `.planning/REQUIREMENTS.md` — MAP-01, MAP-02, MAP-03, UI-02 (et MAP-V2-01 reporté v2 ; Out of Scope incluant clustering et `@gorhom/bottom-sheet`).
- `.planning/phases/01-stabilisation-fondations/01-CONTEXT.md` — design system Phase 1 (tokens, polices, conventions) que D-12 fait évoluer.

### Recherche (cap UI/UX iOS)
- `.planning/research/STACK.md` — Mapbox / clustering (pertinent ici : style, heatmap, markers).
- `.planning/research/ARCHITECTURE.md` — patterns reanimated/gesture (animation des markers).
- `.planning/research/PITFALLS.md` — quirks @rnmapbox (MarkerView vs PointAnnotation, animation), pièges TestFlight.

### Design system & conventions (à RÉVISER per D-12)
- `constants/theme.ts` — tokens `T.bg/surface/primary/...` et `T.cardRadius` (= 4, angles francs → à arrondir).
- `constants/fonts.ts` — objet `F` (polices).
- `constants/config.ts` — `APP_CONFIG.MAPBOX_STYLE` (injection style), `COLORS` (primary #ff2d87, mapBg #0d1a2e non retenu).
- `CLAUDE.md` §Identité visuelle — conventions « angles francs / borderRadius:0 » à réviser (D-12) ; règle 13 (lisibilité vs BlurView).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/map/AppMapView.tsx` — wrapper MapboxGL.MapView + Camera ; `styleURL={APP_CONFIG.MAPBOX_STYLE}` déjà câblé (MAP-01 = changer l'URL). Contient le bouton « Recentrer » (à intégrer au bandeau D-10).
- `components/map/HeatmapLayer.tsx` — ShapeSource + HeatmapLayer ; `heatmapColor`/`heatmapOpacity`/`heatmapRadius` à retravailler (MAP-02). weight = note/10 déjà présent.
- `components/map/PointMarker.tsx` — `PinIcon` (tête+tige+point) sur `PointAnnotation` + Modal preview ; cible MAP-03 (raffiner PinIcon, état sélectionné via `onSelected`, animation).
- `components/map/MapHeader.tsx` + `FriendSelector.tsx` — contrôles à repenser en bandeau (D-10).
- `app/(app)/map/index.tsx` — écran carte : FAB carré (`styles.fab`, borderRadius:0 → arrondi D-12, + haptic D-11), empty hint, toggle viewMode pins/heatmap.
- `lib/haptics.ts` (Phase 1) — `haptics.press()`/`tap()`/`select()` pour D-11.
- reanimated v4 + gesture-handler (Phase 1) — pour animations markers (D-07) et micro-anim FAB (D-11).

### Established Patterns
- `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` — sur tous les composants.
- Couleurs via tokens `T.xxx`, polices via `F.xxx` (jamais hardcodé) — sauf style Mapbox (hex dans Studio).
- `useSafeAreaInsets()` pour les insets (jamais SafeAreaView).
- Icônes SVG custom `components/icons.tsx` (IcoPlus pour le FAB).

### Integration Points
- MAP-01 : `EXPO_PUBLIC_MAPBOX_STYLE` (.env.local + secret EAS) → `APP_CONFIG.MAPBOX_STYLE` → `styleURL`. Changement de valeur = OTA possible (JS), mais un nouveau style natif Mapbox ne requiert pas de rebuild (c'est une URL distante).
- MAP-02/03 : enfants de `MapboxGL.MapView` (HeatmapLayer / PointAnnotation).
- UI-02/D-12 : `map/index.tsx` styles + nouveaux composants de contrôle + tokens de rayon `theme.ts`.

</code_context>

<specifics>
## Specific Ideas

- Heatmap : conserver l'esprit « braise » — rose froid en périphérie, cœur ambre sur les zones denses.
- Marker sélectionné : halo rose + scale, façon « le moment s'illumine quand on le touche ».
- FAB : « plus iOS-friendly » (mots de l'utilisateur) — forme arrondie, fini le carré ; s'inscrit dans le pivot D-12.
- Bandeau de contrôles : signature éditoriale (typo mono/serif, hiérarchie) mais lisible (pas de blur lourd — règle 13).

</specifics>

<deferred>
## Deferred Ideas

- **Clustering des points proches au dézoom** (bulles + compteur, tap-to-zoom) — MAP-V2-01, reporté v2 (migration PointAnnotation→ShapeSource/CircleLayer, item le plus risqué). Hors scope ce cap.
- **Refonte de la preview au tap du marker en bottom sheet natif** — relève de la Phase 3 (IOS-01). Phase 2 garde le Modal custom existant.
- **Verrouillage fin du nouveau langage iOS arrondi** (échelle de rayons exacte, forme FAB rond vs squircle, look du bandeau) — à figer dans un UI-SPEC via `/gsd:ui-phase 2` avant planification.

None autres — discussion restée dans le périmètre de la phase (le pivot D-12 est une évolution assumée du design system, pas une nouvelle capacité produit).

</deferred>

---

*Phase: 2-carte-stylis-e*
*Context gathered: 2026-06-01*

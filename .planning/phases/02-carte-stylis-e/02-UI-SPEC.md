---
phase: 2
slug: carte-stylis-e
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-01
---

# Phase 2 — UI Design Contract · Carte stylisée

> Contrat visuel et d'interaction pour la refonte de l'écran carte (MAP-01/02/03, UI-02).
> Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
> **Périmètre :** style Mapbox sur-mesure, heatmap rose→ambre, markers retravaillés, bandeau de contrôles + FAB, et **verrouillage du pivot design D-12 (formes iOS arrondies)** qui s'applique aux Phases 2→5.
> Langue : copie/labels en français ; tokens/code en anglais.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (design system custom — tokens dans `constants/theme.ts`) |
| Preset | not applicable (React Native / Expo SDK 54 — shadcn ne s'applique pas) |
| Component library | react-native-paper v5 (usage réduit : Snackbar uniquement) + primitives maison (`components/ui/*`) |
| Icon library | SVG custom `components/icons.tsx` (Ico*) — PAS de @expo/vector-icons |
| Font | Cormorant Garamond (serif italic), Inter Tight (sans), JetBrains Mono (mono) — via `constants/fonts.ts` (`F`) |

**shadcn gate :** non applicable. Stack = React Native, pas React/Next.js/Vite. Aucun `components.json`. Registry safety : not applicable.

---

## D-12 — Radius / Shape Language (LOCK — cross-phase 2→5)

Le pivot « éditorial sombre + formes iOS arrondies » remplace l'ancienne règle « angles francs / borderRadius:0 ». **Cette section est la livraison transverse principale de la Phase 2 : elle fige l'échelle de rayons et la forme du FAB pour toutes les phases suivantes.**

### Échelle de rayons (à ajouter dans `Theme` / `constants/theme.ts`)

| Token | Value (px) | Usage |
|-------|-----------|-------|
| `radiusXs` | 8 | Chips, segments de toggle, petits badges |
| `radiusSm` | 12 | Inputs, petits boutons |
| `radiusMd` | 16 | Cards, items de liste, boutons standards (= nouvelle valeur de `cardRadius`) |
| `radiusLg` | 22 | Bandeau de contrôles flottant, grandes cards, conteneurs de surface |
| `radiusXl` | 28 | Conteneur de sheet natif (aligné `sheetCornerRadius`, Phase 3) |
| `pill` | 999 | Boutons pill / toggles entièrement arrondis |
| `fab` | 18 | Rayon du FAB squircle (voir section FAB) |

**Révisions de tokens existants :**
- `cardRadius` : `4` → **`16`** (back-compat conservée : tout code existant qui lit `T.cardRadius` s'arrondit doucement).
- `pill` : `4` → **`999`**.
- Type `Theme` étendu avec les clés `radiusXs/Sm/Md/Lg/Xl` (mêmes valeurs en dark et light).

### Continuité iOS (squircle / coin continu) — OBLIGATOIRE

Sur toute surface arrondie, ajouter **`borderCurve: 'continuous'`** (RN ≥ 0.71, iOS) en plus de `borderRadius`. C'est ce qui donne le « squircle » iOS (coin continu façon icône d'app) plutôt qu'un arc circulaire générique. Token de discipline : tout `borderRadius ≥ radiusSm` s'accompagne de `borderCurve: 'continuous'`.

### CLAUDE.md — §Identité visuelle à réviser (à traiter comme tâche Phase 2)

| Convention actuelle (CLAUDE.md) | Nouvelle convention D-12 |
|---------------------------------|--------------------------|
| « angles francs », `T.cardRadius = 4` | Formes iOS arrondies, `cardRadius = 16` + échelle `radiusXs..Xl` + `borderCurve:'continuous'` |
| FAB carré (`borderRadius:0`) | FAB squircle (voir section FAB) |
| « Avatars : carrés (borderRadius:0) » | **Inchangé pour l'instant** — l'avatar carré reste l'archétype « page de couverture » (Phase 5, UI-08). Ne PAS arrondir les avatars en Phase 2. À réévaluer en Phase 5. |
| « Inputs : underline only » | **Inchangé** en Phase 2 (pas d'input sur la carte). Réévalué quand un input est refondu (Phase 3+). |
| `pill: 4` | `pill: 999` |

> Le planner doit inscrire « mise à jour tokens `theme.ts` + section §Identité visuelle de CLAUDE.md » comme une tâche explicite de la Phase 2.

---

## FAB — Forme & comportement (LOCK · UI-02 / D-11 / D-12)

**Forme verrouillée : squircle (carré arrondi à coin continu), PAS un cercle.**
Rationale : le requirement exige un FAB **non-Material** ; un cercle plein = langage Material. Le squircle conserve le caractère « bloc » éditorial tout en étant indiscutablement iOS (langage icône d'app). « Fini le carré » (mots utilisateur) = on passe de `borderRadius:0` à un squircle généreux.

| Propriété | Valeur |
|-----------|--------|
| Taille | 56 × 56 (touch target ≥ 44 ✓ ; passe de 52 → 56) |
| `borderRadius` | `T.fab` = 18 |
| `borderCurve` | `'continuous'` (obligatoire) |
| Fond | `T.primary` (#ff2d87) |
| Icône | `IcoPlus` 24, couleur `T.text` (#fff) |
| Ombre / glow | `shadowColor: T.primary`, `shadowOffset:{0,6}`, `shadowOpacity:0.35`, `shadowRadius:16`, `elevation:8` |
| Position | `right: 20`, `bottom: insets.bottom + 80` (inchangé) |
| Visibilité | masqué en mode « vue ami » (`viewingFriendId`) — inchangé |
| Label a11y | `accessibilityLabel="Inscrire un moment"` |

**Micro-animation au tap (D-11) :** `pressIn` → scale `0.92` (spring) ; `pressOut` → retour `1.0` (spring, damping ~14, stiffness ~220). Via reanimated v4 (dispo Phase 1). N'animer que `transform: scale` (compositor-friendly).

**Haptique (D-11) :** `haptics.press()` (impact **medium**) au `onPress` du FAB (ouverture création = action importante). Aujourd'hui le FAB n'a aucun haptique.

---

## Markers — Pin raffiné, sélection, apparition (LOCK · MAP-03)

Continuité avec le pin existant (tête ronde bord rose + tige + point), **pas de nouvelle forme** (D-05). Rendu sur `PointAnnotation` (annotation native, snapshot de la View RN — confirmé code + PITFALLS §4/§5).

### Pin au repos (raffinement D-05)
| Élément | Valeur |
|---------|--------|
| Tête (cercle) | 24 × 24, `borderRadius:12`, fond `T.bg`, bord `2px T.primary` |
| Point intérieur | 9 × 9, `borderRadius` plein, `T.primary` |
| Tige | 2 × 8, `T.primary` |
| Point bas (ancre) | 4 × 4, `T.primary` |
| Halo léger (glow) | `shadowColor:T.primary`, `shadowRadius:6`, `shadowOpacity:0.5`, `shadowOffset:{0,0}` — statique, capturé dans le snapshot |
| Ancre | `{ x: 0.5, y: 1 }` (inchangé) |

### État sélectionné (D-06)
Au tap (avant ouverture de la preview Modal existante) : le pin se ré-affiche en variante **agrandie + halo** — `scale 1.25` (rendu en variante de taille, pas en transform animé, à cause du snapshot natif) :
| Élément | Valeur |
|---------|--------|
| Halo (anneau) | cercle 44 × 44 derrière la tête, fond `rgba(255,45,135,0.12)`, bord `1px rgba(255,45,135,0.45)` |
| Tête sélectionnée | 30 × 30 (≈ ×1.25), bord `2px T.primary` |
| Déclencheur | `onSelected` → état local `selected` → re-render de la variante → `PointAnnotation` re-snapshote |

> Contrainte snapshot (PITFALLS §4) : `PointAnnotation` rend un bitmap. On change l'**apparence** en re-rendant le contenu de l'annotation (toggle de prop), pas via une transform reanimated sur ses enfants.

### Animation d'apparition (D-07)
- **Cible :** pop/scale-up en cascade (scale + fade depuis 0, stagger).
- **Repli VERROUILLÉ comme défaut sûr :** **fondu simple** (opacity 0→1, 280ms, easing `ease-out`) avec **stagger `index × 40ms` plafonné à 320ms**. Raison : le snapshot natif de `PointAnnotation` ne garantit pas l'animation de scale de ses enfants (PITFALLS §4/§5). Le scale-up reste un **bonus** à tenter via un spike dev ; s'il ne s'anime pas proprement → on s'en tient au fondu staggered. La preview ne doit jamais clignoter sans pins.
- N'animer que `opacity` (et `scale` si le spike réussit).

---

## Heatmap — Dégradé rose→ambre & opacité par zoom (LOCK · MAP-02 / D-08, D-09)

Esprit « braise » : rose froid en périphérie, cœur ambre chaud sur les zones denses. Remplace l'actuel violet→#e91e8c→orange-rouge.

### `heatmapColor` — stops sur `heatmap-density` (0→1)
| Densité | Couleur | Intention |
|---------|---------|-----------|
| 0.0 | `rgba(0,0,0,0)` | transparent |
| 0.1 | `rgba(255,45,135,0.15)` | rose froid très faible (périphérie) |
| 0.3 | `rgba(255,45,135,0.55)` | rose signature (#ff2d87) |
| 0.5 | `#ff5a7a` | rose-corail tiède |
| 0.7 | `#ff8a4c` | corail-orange |
| 0.9 | `#ffb020` | ambre chaud |
| 1.0 | `#ffc24d` | ambre/or lumineux (cœur le plus dense) |

### `heatmapOpacity` — décroissante au zoom proche → lueur douce (D-09)
Interpolation `linear` sur `['zoom']` :
| Zoom | Opacité |
|------|---------|
| 10 | 0.85 |
| 13 | 0.80 |
| 15 | 0.55 |
| 17 | 0.35 |
| 19 | 0.25 |

> Au zoom proche, la heatmap devient une lueur diffuse (carte stylisée visible dessous), pas un aplat ni une disparition totale.

### Autres paramètres
| Param | Valeur |
|-------|--------|
| `heatmapRadius` | interp zoom : `10→22`, `14→44`, `18→70` (légèrement élargi vs actuel pour l'effet lueur) |
| `heatmapWeight` | `['interpolate',['linear'],['get','weight'],0,0,1,1]` (weight = note/10, inchangé) |
| `heatmapIntensity` | interp zoom : `10→0.8`, `14→1.4` |

Rappel (D-09) : toggle pins/heatmap **mutuellement exclusifs** — en mode heatmap, aucun pin.

---

## Mapbox Studio — Spec de style sur-mesure (LOCK · MAP-01 / D-01..D-04)

> **Étape MANUELLE utilisateur (checkpoint humain, D-04) :** Claude fournit cette recette ; l'utilisateur la reproduit dans Mapbox Studio, publie, et colle l'URL `mapbox://styles/...` dans `EXPO_PUBLIC_MAPBOX_STYLE`. Le code ne change qu'une URL (`APP_CONFIG.MAPBOX_STYLE`, déjà câblé). Base de départ recommandée dans Studio : **Mapbox Dark**.

**Principes :** fond anthracite quasi-noir (D-03, pas le bleu nuit #0d1a2e), carte sombre **mais lisible** (D-01), touches rose **désaturées** sur eau + grands axes (D-02), labels minimalistes.

### Couleurs par calque (hex à appliquer dans Studio)
| Calque | Hex | Note |
|--------|-----|------|
| Background / land | `#08080a` | anthracite proche de `T.bg` #000, très légèrement relevé pour que pins/heatmap ressortent |
| Water | `#241019` | rose-prune **désaturé** (signature D-02) — sombre, ne noie pas les points |
| Building fill | `#0e0d10` | juste au-dessus du fond |
| Roads — motorway/trunk/primary | `#3a2630` | rose-brun désaturé, **visible** mais sombre (grands axes = repère, D-01/D-02) |
| Roads — secondary/tertiary | `#1e1a1e` | neutre sombre, à peine visible |
| Roads — minor/residential | `#161416` | quasi invisible (densité réduite) |
| Label text (place/quartier/ville) | `#8a8a8a` (= `T.textFaint`) | halo `#000000` 1px |
| Label text — grandes artères | `#b0a0a8` | gris-rose faible (signature légère) |

### Densité de labels (D-01)
- **Conserver :** pays, villes, communes, **quartiers** (neighbourhood), grandes artères.
- **Retirer :** POI (points d'intérêt), labels de rues mineures, transit/stations, numéros.
- Icônes POI : **désactivées**.

---

## Bandeau de contrôles flottant (LOCK · UI-02 / D-10)

Refonte des contrôles flottants (toggle pins/heatmap, sélecteur d'ami, recentrer) en **bandeau/cluster éditorial signature**, hiérarchie forte (typo mono/serif). **Lisibilité > blur lourd** (règle 13 CLAUDE.md : le BlurView a nui à la lisibilité de la tab bar).

### Surface (anti-blur, règle 13)
| Propriété | Valeur |
|-----------|--------|
| Fond | surface semi-opaque LISIBLE : `T.surface` à **~0.92** d'alpha (ex. `rgba(10,10,10,0.92)` en dark) — **PAS de BlurView** |
| Rayon | `T.radiusLg` (22) + `borderCurve:'continuous'` |
| Bord | `1px T.border` |
| Position | flottant haut, sous la safe area : `top: insets.top + 8`, marges latérales 16 |

### Composition (hiérarchie éditoriale)
1. **Bloc titre** (gauche) : eyebrow mono `lovemap` (F.mono, 7px, letterSpacing 2.5, uppercase, `T.textFaint`) + titre serif italic (F.serif, 18px, `T.text`) = `mes moments · NN` ou `carte de {nom}`.
2. **Sélecteur d'ami** (droite) : bouton pill (`T.pill`/`radiusXs`, `borderCurve:'continuous'`) — `FriendSelector` existant restylé.
3. **Toggle segmenté** (sous le titre) : segmented control pill, deux segments **Points** / **Heatmap** ; segment actif = fond `T.primary`, texte `T.text` ; inactif = texte `T.textFaint`. Coins du conteneur `radiusSm`, segments `radiusXs`, `borderCurve:'continuous'`.

### Bouton Recentrer (D-10)
Détaché du bandeau, flottant bas-droite **au-dessus du FAB** : petit bouton squircle (40×40, `radiusSm`, `borderCurve:'continuous'`), fond `T.surface` semi-opaque, bord `1px T.border`, label mono `Recentrer` OU icône. Affiché conditionnellement (déjà géré : `showRecenter`).

### Haptiques des contrôles (D-10, discrétion fine)
| Contrôle | Haptique |
|----------|----------|
| Toggle Points/Heatmap | `haptics.select()` (changement de sélection) |
| Sélection d'un ami (FriendSelector) | `haptics.select()` |
| Recentrer | `haptics.tap()` (impact light) |
| FAB (création) | `haptics.press()` (impact medium) — voir section FAB |

---

## Spacing Scale

Échelle canonique (multiples de 4) :

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gaps d'icônes, padding inline |
| sm | 8px | Espacement compact (gap segments, marge eyebrow) |
| md | 12px | Espacement intermédiaire (padding pill, gaps bandeau) |
| lg | 16px | Espacement par défaut / marges latérales bandeau |
| xl | 24px | Padding de section (preview Modal) |
| 2xl | 32px | Ruptures majeures |
| 3xl | 48px | Espacement de niveau écran |

**Exceptions :** touch targets iOS — FAB 56, Recenter 40, deleteBtn 52 (≥44 garanti). Micro-spacings typographiques existants (letterSpacing eyebrow 2–2.5, gaps note-bar 3px) conservés. Insets via `useSafeAreaInsets()` (jamais valeurs en dur).

---

## Typography

Système éditorial 3 familles préexistant (`F`), non re-litigé. Surfaces de **cette phase** :

| Role | Famille (weight) | Size | Line Height | Usage sur la carte |
|------|------------------|------|-------------|--------------------|
| Display | `F.serifLight` (Cormorant 300 italic) | 56px | 52 | Note du point dans la preview (`56`) |
| Title | `F.serif` (Cormorant 400 italic) | 18px | ~22 | Titre du bandeau (`mes moments · NN`) |
| Quote | `F.serif` (Cormorant 400 italic) | 18px | 26 | Commentaire du point (preview) |
| Eyebrow | `F.mono` (JetBrains 400) | 7–10px | — | Labels uppercase (lovemap, toggle, méta, Recentrer) — letterSpacing 2–2.5, uppercase |

**Weights par surface :** serif italic 300/400 (display/title/quote) + mono 400 (eyebrows/labels). Pas de sans-serif requis sur la carte. Dynamic Type borné via `AppText` (titres serif `maxFontSizeMultiplier ≈ 1.3`, eyebrows `≈ 1.2`) — cf. PITFALLS « Dynamic Type ».

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `T.bg` #000000 (carte : base anthracite `#08080a`) | Fond d'écran + surface de carte |
| Secondary (30%) | `T.surface` #0a0a0a (bandeau : `rgba(10,10,10,0.92)`) | Bandeau de contrôles, recenter, preview Modal |
| Accent (10%) | `T.primary` #ff2d87 | voir liste réservée ci-dessous |
| Data-viz hot | `#ffb020` → `#ffc24d` (ambre) | **Heatmap uniquement** (cœur dense) — pas un accent UI |
| Destructive | `T.danger` (dark #a91860) | Suppression de point (« Effacer cette page ») |

**Accent `T.primary` réservé à :** markers (bord + point), bord/point du halo de sélection, segment actif du toggle, FAB, glow du FAB et des pins, extrémité **rose** du dégradé heatmap, eyebrows/labels accentués. Jamais « tous les éléments interactifs » : les contrôles inactifs restent `T.textFaint`/`T.border`.

Discipline thème (PITFALLS) : tester dark **et** light, aucun hex/fontFamily en dur (sauf les hex du style Mapbox, qui vivent dans Studio, et la base `#08080a`/heatmap qui sont des constantes de data-viz à centraliser dans `constants/config.ts` si réutilisées).

---

## Copywriting Contract

Tous en français (règle 6). Ton éditorial « journal intime ».

| Element | Copy |
|---------|------|
| Primary CTA (FAB, icon-only) | `+` → ouvre la création · a11y : « Inscrire un moment » |
| Toggle — mode pins | « Points » |
| Toggle — mode heatmap | « Heatmap » |
| Titre bandeau (soi) | « mes moments · {NN} » (compteur 2 chiffres) |
| Titre bandeau (ami) | « carte de {nom} » |
| Bouton recentrer | « Recentrer » |
| Empty state (aucun point, non bloquant) | « Appuyez sur + pour inscrire votre premier moment » |
| Error state (chargement) | « Erreur de chargement. Vérifiez votre connexion. » + `haptics.error()` |
| Destructive — suppression de point | Titre « Effacer cette page » · corps « Cette action est irréversible. » · actions [ Annuler · Effacer ] · `haptics.warn()` à la confirmation |

> Note : la suppression vit dans la preview Modal existante (conservée cette phase — la migration vers sheet natif est Phase 3, IOS-01).

---

## Motion & Interaction Contract

| Interaction | Spec | Propriété animée |
|-------------|------|------------------|
| Tap FAB | scale 1.0→0.92 (pressIn) → 1.0 (pressOut), spring damping ~14 / stiffness ~220 | `transform: scale` |
| Apparition markers | opacity 0→1, 280ms ease-out, stagger `index×40ms` (cap 320ms) ; scale-up bonus si spike OK | `opacity` (+ `scale` optionnel) |
| Sélection marker | re-render variante agrandie + halo (snapshot natif, pas de transform) | apparence (re-snapshot) |
| Toggle / recentrer | feedback haptique immédiat (fire-and-forget, pas d'`await`) | — |

Contraintes perf (PITFALLS §5) : n'animer que `transform`/`opacity` ; mémoïser le GeoJSON de la heatmap (déjà `useMemo`) ; **aucun BlurView animé** ; profiler le pan de carte sur device.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| (aucun) | — | not applicable — pas de shadcn/registry sur React Native |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

## Traceability — Décisions CONTEXT.md → Contrat

| Decision | Verrouillé dans |
|----------|-----------------|
| D-01/D-03 (carte sombre lisible, anthracite) | §Mapbox Studio (hex par calque, densité labels) |
| D-02 (touches rose désaturées) | §Mapbox Studio (water #241019, axes #3a2630) |
| D-04 (style produit en Studio, checkpoint humain) | §Mapbox Studio (étape manuelle utilisateur) |
| D-05 (pin raffiné) | §Markers — Pin au repos |
| D-06 (sélection = agrandissement + halo) | §Markers — État sélectionné |
| D-07 (apparition pop + repli fondu) | §Markers — Animation d'apparition |
| D-08 (rose→ambre) | §Heatmap — heatmapColor |
| D-09 (opacité décroissante au zoom) | §Heatmap — heatmapOpacity |
| D-10 (bandeau éditorial, anti-blur) | §Bandeau de contrôles flottant |
| D-11 (haptic press FAB + micro-anim) | §FAB + §Motion |
| D-12 (formes iOS arrondies, FAB non carré) | §D-12 Radius/Shape + §FAB |
| Discrétion : hex heatmap + courbe opacité | §Heatmap (verrouillés) |
| Discrétion : spec Studio par calque | §Mapbox Studio (verrouillée) |
| Discrétion : haptiques fins des contrôles | §Bandeau — table haptiques |
| Discrétion : forme FAB + échelle rayons | §D-12 + §FAB (squircle 56/r18, échelle radiusXs..Xl) |

*Phase: 2-carte-stylis-e · UI-SPEC généré 2026-06-01*

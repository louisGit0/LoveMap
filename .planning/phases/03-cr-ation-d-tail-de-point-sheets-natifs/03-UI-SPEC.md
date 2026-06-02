---
phase: 3
slug: cr-ation-d-tail-de-point-sheets-natifs
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-02
---

# Phase 3 — UI Design Contract · Création & Détail de point (sheets natifs)

> Contrat visuel et d'interaction pour la refonte de `point/new` et `point/[id]` en **bottom sheets iOS natives** (Expo Router `formSheet`), archétype « page de carnet ».
> Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
> **Périmètre :** IOS-01 (form sheet natif : poignée, swipe-to-dismiss, détent ≥ 0.7), IOS-02 (migration Modal custom → routes Stack, swipe natif, tap-pin → détail direct), UI-03 (`point/new` carnet), UI-04 (`point/[id]` carnet).
> **Logique métier PRÉSERVÉE** (D-07) : partenaire obligatoire, RPC `create_point`, consentement `is_visible`, suppression, date saisie. Refonte de présentation uniquement.
> Langue : copie/labels en français ; tokens/code en anglais.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (design system custom — tokens dans `constants/theme.ts`) |
| Preset | not applicable (React Native / Expo SDK 54 — shadcn ne s'applique pas) |
| Component library | react-native-paper v5 (usage réduit : `Snackbar` uniquement) + primitives maison (`components/ui/*`) |
| Sheet engine | **Expo Router `formSheet` natif** via `react-native-screens` ~4.16.0 — **zéro nouvelle dépendance** (D-01) |
| Icon library | SVG custom `components/icons.tsx` (`Ico*`) — PAS de @expo/vector-icons |
| Font | Cormorant Garamond (serif italic), Inter Tight (sans), JetBrains Mono (mono) — via `constants/fonts.ts` (`F`) |
| Text primitive | `components/ui/AppText` (Dynamic Type borné par variant : `body` 2.0 / `title` 1.3 / `eyebrow` 1.2) |

**shadcn gate :** non applicable. Stack = React Native, pas React/Next.js/Vite. Aucun `components.json`. Registry safety : not applicable.

**Note de stack (correctif PITFALLS) :** `react-native-reanimated` v4 + `react-native-gesture-handler` **sont installés** depuis la Phase 1 (builds #17/#18) et la racine est wrappée dans `GestureHandlerRootView` ; `runtimeVersion` est en policy `fingerprint`. La note PITFALLS « libs absentes » est périmée. On conserve néanmoins le **form sheet natif** (D-01) : on n'introduit PAS `@gorhom/bottom-sheet` (Out of Scope REQUIREMENTS + bugs compat SDK 54). Conséquence concrète : **le scroll/clavier interne utilise un `ScrollView` RN standard** (et NON `BottomSheetScrollView`/`BottomSheetTextInput`, qui sont propres à gorhom et ne s'appliquent pas ici).

---

## Native Sheet Config (LOCK · IOS-01 / D-01..D-04)

Chrome **natif iOS assumé** (poignée + coins arrondis). L'identité éditoriale vit **à l'intérieur** du sheet (D-03). On n'applique **aucun `borderRadius` forcé** au conteneur du sheet.

### Options de route `formSheet` (création ET détail — détent unique)

| Option | Valeur | Source |
|--------|--------|--------|
| `presentation` | `'formSheet'` | D-01 |
| `sheetAllowedDetents` | `[0.92]` — **détent unique large** (~0.9, ≥ 0.7) | D-02 ; détent unique (pas de medium) ; ≥ 0.7 atténue le bug iOS 26 « sheet rabougri » (PITFALLS §Native Sheets 1) |
| `sheetGrabberVisible` | `true` | D-03 (poignée iOS visible) |
| `sheetCornerRadius` | `28` (= `T.radiusXl`, réservé Phase 2 / D-12) | D-03 ; aligné échelle de rayons |
| `headerShown` | `false` | header éditorial interne, pas de header natif |
| `gestureEnabled` | `true` | swipe-to-dismiss natif (IOS-01) |

> **Détent unique** : pas d'expansion vers plein écran ; le swipe vers le bas (ou la poignée) **ferme**. Cohérent D-02 (« pas de détent medium, le formulaire est long »).

### Mitigation flash de fond au swipe (PITFALLS / ARCHITECTURE §Gestures)
Poser `contentStyle: { backgroundColor: T.bg }` dans les `screenOptions` du Stack parent → évite le flash de couleur de fond pendant la transition/dismiss.

### Test obligatoire (PITFALLS §Native Sheets 1)
Valider le rendu **sur device iOS 26** (pas seulement simulateur) : `react-native-screens` 4.16.0 est cité comme affecté par le rendu « trop petit » aux petits détents. Le détent `0.92` est choisi haut **exprès** pour contourner ce piège.

---

## Navigation & Routing (LOCK · IOS-02 / D-05, D-06)

### Restructuration `(app)` — Stack parent + sheets
Aujourd'hui `point/new` et `point/[id]` sont des `Tabs.Screen` cachés (`href: null`, écrans pleins). Migration :

1. **Stack parent** englobant le groupe d'onglets (les `Tabs` actuels) **et** les deux routes sheet.
2. Déclarer `point/new` et `point/[id]` comme `Stack.Screen` avec les options `formSheet` ci-dessus, **au bon niveau du Stack parent** (PITFALLS §Native Sheets 4 : une route sheet mal imbriquée pousse en plein écran et casse le retour).
3. **Retirer** les deux entrées `Tabs.Screen ... href: null` correspondantes de `app/(app)/_layout.tsx`.
4. `friends/requests` reste un écran caché de la tab bar (hors périmètre Phase 3) — ne pas le migrer.

### Tap-pin → détail direct (D-06)
- **Supprimer entièrement la `Modal` d'aperçu custom** dans `components/map/PointMarker.tsx` (tout le bloc `<Modal>` + ses styles). Le composant ne garde que le `PointAnnotation` (pin au repos / sélectionné, inchangé Phase 2).
- `onSelected` du `PointAnnotation` → `router.push('/(app)/point/' + point.id)` (ouvre le sheet de détail natif). Conserver `setSelected(true)` + `refresh()` pour l'état visuel agrandi du pin (Phase 2), retirer `setModalVisible`.

### Points d'entrée de création (discrétion → conservés)
FAB carte (`handleFabPress`) et long-press carte (`handleLongPress`) → `router.push('/(app)/point/new', { params: { latitude, longitude } })` (le sheet de création s'ouvre, params GPS transmis comme aujourd'hui). `haptics.press()` au FAB reste (Phase 2).

### Retour / dismiss
- **Plus de bouton retour flottant** dans le détail : le `TouchableOpacity` `backBtn` (IcoArrow) **est supprimé** — la fermeture passe par la poignée / le swipe-down natif (esprit IOS-02 « gestes natifs »).
- À la fermeture, vérifier le retour sur l'écran d'origine (la carte). Le `router.replace('/(app)/map')` après création reste valable.

---

## Dismiss Confirmation (LOCK · D-04)

| Sheet | Comportement |
|-------|--------------|
| **Création** | Si **une saisie est non vide** (`comment`, `durationMinutes`, `note ≠ 7` défaut, ou partenaire sélectionné) → **confirmation** avant fermeture. Sinon, fermeture directe. |
| **Détail (lecture)** | Fermeture **directe**, sans confirmation. |
| **Détail (mode édition actif)** | Si des champs d'édition sont modifiés → même confirmation que création. |

**Implémentation :** intercepter l'événement de navigation `beforeRemove` (couvre swipe-down natif **et** tap « Annuler ») ; si « dirty », `preventDefault()` + afficher l'`Alert`. Ne PAS se reposer uniquement sur le bouton Annuler (le swipe natif contournerait la garde).

**Copie de confirmation :**
- Titre : **« Abandonner ce moment ? »**
- Corps : **« Votre saisie ne sera pas enregistrée. »**
- Actions : **[ Continuer l'écriture · Abandonner ]** (`Abandonner` en style `destructive` natif iOS)
- Haptique : `haptics.warn()` à l'ouverture de l'alerte.

---

## Page Composition — Création (LOCK · UI-03 / D-08, D-09, D-10)

Carnet **suggéré / sobre** (D-08) : porté par la typo + la hiérarchie. **Aucun skeuomorphisme** (ni grain papier, ni lignes de cahier, ni `innerBorder` décoratif — l'actuel `innerBorder` est **supprimé**). Optimisé pour la **saisie structurée** (D-09).

**Ordre vertical (la NOTE en premier — D-10) :**
1. *(poignée native iOS — non rendue par nous)*
2. **Eyebrow** mono : `N° 001 — Nouvelle page` (`F.mono`, accent `T.primary`).
3. **NOTE — geste central** (D-10) : valeur serif géante `Display` + `/10` mono + barre de 10 segments tappables. C'est le hero de la page : on inscrit d'abord l'intensité.
4. **Commentaire** : input serif italic multiligne (placeholder « Décrivez ce moment… »), compteur `n/500` mono.
5. **Partenaire** (label + `Requis`) : rangée horizontale de chips d'amis (avatar carré initiale serif + nom). CTA bloqué si aucun sélectionné ; message si `friends.length === 0`.
6. **Durée** : input serif italic numérique (placeholder « — »).
7. **Date** : 3 segments JJ / MM / AAAA (mono), pré-remplis à aujourd'hui.
8. **Lieu** : recherche d'adresse (input serif italic + bouton `IcoSearch`) → mini-carte pannable (pin fixe centré, le fond glisse dessous) → adresse résolue (mono, uppercase, faint).
9. **CTA** « Sceller la page » (inline, fin de page — voir §Action Placement).
10. Lien **« Annuler »** discret (mono, sous le CTA).

**Formes internes (D-12 — l'« angles francs » est mort) :**
| Élément | Rayon |
|---------|-------|
| Mini-carte (conteneur) | `T.radiusMd` (16) + `borderCurve:'continuous'` |
| Chip partenaire | `T.radiusSm` (12) + `borderCurve:'continuous'` |
| Avatar partenaire (dans le chip) | carré `borderRadius:0` — **inchangé** (archétype « page de couverture », réévalué Phase 5 par D-12) |
| Segments de note | `T.radiusXs` (8) |
| Bloc CTA | `T.radiusMd` (16) + `borderCurve:'continuous'` |
| Inputs underline | pas de rayon (underline only — règle CLAUDE.md conservée) |

---

## Page Composition — Détail (LOCK · UI-04 / D-08, D-09)

**Traitement DISTINCT de la création** (D-09) : optimisé pour la **lecture éditoriale** (on RELIT le moment). Carnet sobre (D-08).

**Ordre vertical :**
1. *(poignée native iOS)*
2. **Mini-carte statique** (haut) = tampon de lieu : carte non interactive + marker centré. **Plus de bouton retour flottant** (supprimé — dismiss natif).
3. **Eyebrow** mono : `La page` (lecture).
4. **NOTE** : valeur serif géante `Display` (80) + `/10` + barre de 10 segments (lecture seule).
5. **Pull-quote** (si commentaire) : guillemets `«` / `»` serif accentués + texte serif italic `Heading`. Cœur éditorial de la page (D-08).
6. **Photos** (si présentes) : rangée horizontale de vignettes — comportement existant **conservé** (discrétion D : pas de refonte photos).
7. **Table de métadonnées** : clés mono uppercase faint alignées gauche / valeurs serif italic alignées droite — `Lieu`, `Date`, `Durée`, `Avec` (+ badge de consentement).
8. **Bloc d'action contextuel** (voir §Action Placement) : consentement partenaire, OU mode édition, OU rien.
9. **Trigger destructeur** (propriétaire) : « Effacer cette page » (danger, inline-fin).

**Formes internes (D-12) :**
| Élément | Rayon |
|---------|-------|
| Mini-carte (conteneur) | `T.radiusMd` (16) + `borderCurve:'continuous'` |
| Vignette photo | `T.radiusSm` (12) + `borderCurve:'continuous'` |
| Badge de consentement | `T.radiusXs` (8) |
| Boutons consentement (Sceller / Modifier) | `T.radiusMd` (16) + `borderCurve:'continuous'` |
| Marker de la mini-carte | rond (inchangé) |

---

## Action Placement (LOCK · discrétion CONTEXT)

**Règle transverse : tous les boutons d'action sont INLINE en fin de flux scrollable — PAS de footer sticky.**

**Rationale :** (1) le sheet natif **ne se redimensionne pas au clavier** — un footer collé se battrait avec le clavier (PITFALLS §Native Sheets 2) ; (2) métaphore carnet : on atteint le bas de la page **puis** on la scelle (« sceller la page » = geste de clôture). On réserve `paddingBottom: insets.bottom + 32` pour dégager le home indicator.

### Création
| Action | Type | Typo | Couleur |
|--------|------|------|---------|
| **Sceller la page** (primaire) | bloc plein, inline-fin | eyebrow mono `Archiver` + label serif italic `Heading` | fond `T.primary`, flèche `IcoArrow` accent |
| **Annuler** (tertiaire) | lien texte, sous le CTA | mono uppercase petit | `T.textFaint` |

CTA désactivé (`opacity 0.4`) si `submitting` ou `friends.length === 0`. État : « Scellement… » pendant l'envoi.

### Détail — consentement partenaire (`isPartner && isPending`)
| Action | Type | Typo | Couleur |
|--------|------|------|---------|
| **Sceller** (primaire, accepter) | bouton plein, `flex:2` | serif italic `Heading` | fond `T.primary` |
| **Modifier** (secondaire, → mode édition) | bouton bordé, `flex:1` | mono uppercase | bord `T.border`, texte `T.textDim` |
| **Refuser ce taguage** (tertiaire) | lien texte centré | serif italic souligné | `T.textFaint` |

> **Harmonisation typo (amélioration vs existant) :** le primaire de consentement passe de `F.sansMedium` à **serif italic** pour s'aligner sur le CTA de création (« Sceller la page »). Le secondaire passe en **mono uppercase**. On élimine `F.sans*` de ces pages → discipline 2 familles (serif + mono).

### Détail — mode édition
« Sauvegarder et sceller » (inline-fin du formulaire d'édition), même traitement que le CTA primaire. Lien « Annuler » mono dessous.

### Détail — destructeur (propriétaire)
« Effacer cette page » : trigger discret inline-fin (icône `IcoTrash` + texte serif italic souligné), couleur **`T.danger`** (et NON `T.primary` — l'accent rose reste réservé aux actions affirmatives). La confirmation est une **`Alert` native iOS** (style `destructive` = rouge système).

---

## Keyboard Handling (LOCK · discrétion CONTEXT / PITFALLS §Native Sheets 2)

Le sheet natif **ne se redimensionne pas** à l'ouverture du clavier. Pattern à respecter dans `point/new` et le mode édition de `point/[id]` :

1. Racine du contenu = `KeyboardAvoidingView` (`behavior={Platform.OS === 'ios' ? 'padding' : undefined}`).
2. À l'intérieur = **`ScrollView` RN standard** (`keyboardShouldPersistTaps="handled"`, `showsVerticalScrollIndicator={false}`), avec `contentContainerStyle` réservant `paddingBottom: insets.bottom + 32`.
3. **NE PAS** utiliser `BottomSheetScrollView` / `BottomSheetTextInput` (propres à gorhom, non installé — on est en sheet natif).
4. Le champ **Commentaire** (multiligne) doit pouvoir scroller au-dessus du clavier : s'appuyer sur le scroll auto au focus ; tester sur device le champ commentaire **et** les segments de date.
5. Tester l'ouverture/fermeture clavier sur **iOS device** (divergence simulateur documentée).

---

## Spacing Scale

Échelle canonique (set standard `{4, 8, 16, 24, 32, 48, 64}`) :

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gaps de segments de note, micro-padding inline |
| sm | 8px | Espacement compact (gap chips, gap actions consentement, marge eyebrow) |
| lg | 16px | Espacement par défaut, marges de mini-carte, gap de note-display |
| xl | 24px | Padding de contenu du sheet, dividers verticaux, padding de section |
| 2xl | 32px | Ruptures majeures, `paddingBottom` au-dessus du home indicator (`insets.bottom + 32`) |
| 3xl | 48px | Espacement de bas de page (création) |

**Exceptions (hors échelle principale) :**
- `pillPadX = 12px` — **iOS intermediate (3×4px)**, padding horizontal des chips partenaire et segments uniquement (hérité Phase 2 : 8 serre le label, 16 casse la compacité). Un `12` apparaissant ailleurs doit être réaffecté à `sm` (8) ou `lg` (16).
- Touch targets iOS : CTA création 64, boutons consentement 52–56, trigger suppression ≥ 44, poignée native. Tous ≥ 44 garantis.
- Micro-spacings typographiques conservés : `letterSpacing` eyebrow 2–2.5, gaps de note-bar 3–4px, `gap` date 8.
- Insets via `useSafeAreaInsets()` (jamais `SafeAreaView`, jamais valeur en dur). `SafeAreaProvider` déjà injecté au root par Expo Router.

---

## Typography

Système éditorial 3 familles préexistant (`F`), borné via `AppText`. **Création et détail = deux échelles distinctes** (D-09), chacune ≤ 4 tailles de rôle et **2 tiers de graisse** (serif 300/400 + mono 400 — pas de `F.sans*` sur ces pages).

### Création (4 rôles)
| Role | Famille (graisse) | Size | Line Height | Usage |
|------|-------------------|------|-------------|-------|
| Display | `F.serifLight` (300) | 72px | 68 | **Valeur de la note** (hero, D-10) |
| Heading | `F.serif` (400) | 24px | 28 | Label du CTA « Sceller la page » |
| Body | `F.serif` (400) | 20px | 28 | Inputs serif italic (commentaire, recherche, durée), noms de partenaires |
| Eyebrow | `F.mono` (400) | 10px | — | `N° 001 — Nouvelle page`, labels de champ, `Requis`, `Annuler`, adresse résolue (9–10) |

### Détail (4 rôles)
| Role | Famille (graisse) | Size | Line Height | Usage |
|------|-------------------|------|-------------|-------|
| Display | `F.serifLight` (300) | 80px | 76 | **Valeur de la note** (hero lecture) |
| Heading | `F.serif` (400) | 22px | 30 | Pull-quote (commentaire), question de consentement, label « Sceller » |
| Body | `F.serif` (400) | 16px | 22 | Valeurs de la table de métadonnées |
| Eyebrow | `F.mono` (400) | 9px | — | `La page`, clés de méta, badge de consentement, `Modifier` |

**Companions micro-type (exceptions, hors comptage des 4 rôles) :** `/10` denom mono (16 création / 18 détail) ; guillemets `« »` `F.serifMedium` 32 (détail) ; segments de date mono 22 (création) ; séparateurs mono.

**Dynamic Type :** `AppText` borne par variant (`title`/Display+Heading ≤ 1.3 ; `eyebrow` ≤ 1.2 ; `body` ≤ 2.0). Éviter `height`/`width` fixes sur les conteneurs de texte (PITFALLS §Redesign 3).

---

## Color

Surface dominante = **intérieur du sheet** (le chrome/poignée/backdrop est natif iOS). Split 60/30/10 :

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `T.bg` (#000000 dark / #ffffff light) | Fond du contenu du sheet (création + détail) |
| Secondary (30%) | `T.surface` / `T.surface2` / `T.border` | Conteneur mini-carte, pistes de segments (`surface2`), avatar partenaire (`surface2`), dividers/bordures (`border`), bord de la flèche CTA |
| Accent (10%) | `T.primary` (#ff2d87, identique dark/light) | voir liste réservée ci-dessous |
| Destructive | `T.danger` (#a91860 dark / #c41960 light) | Suppression de point uniquement |

**Accent `T.primary` réservé à (création) :** valeur de la note (Display), segments de note actifs, eyebrow `N° 001` accentué, label `Requis`, fond du CTA « Sceller la page », flèche du CTA, chip partenaire **sélectionné** (fond), point central de la mini-carte.

**Accent `T.primary` réservé à (détail) :** valeur de la note (Display), segments de note actifs, guillemets `« »`, eyebrow accentué, fond du bouton « Sceller » (consentement / sauvegarder), bord du badge de consentement `accepted`, flèche de « Sauvegarder et sceller », marker de la mini-carte.

**Jamais « tous les éléments interactifs ».** Les champs au repos, chips non sélectionnés, boutons secondaires, dividers restent `T.textFaint`/`T.textDim`/`T.border`. Le **`T.danger`** est réservé au trigger « Effacer cette page » (+ Alert destructive native).

**Discipline thème (PITFALLS §Redesign 2) :** tester dark **et** light sur chaque écran ; aucun hex/`fontFamily` en dur ; `makeStyles(T)` recalculé via `useMemo([T])`. Le `T.bg + 'cc'` du bouton retour disparaît avec la suppression du bouton.

---

## Copywriting Contract

Tous en français (règle 6). Ton éditorial « journal intime ».

### Création
| Element | Copy |
|---------|------|
| Eyebrow de page | « N° 001 — Nouvelle page » |
| Label — note | « Note » |
| Label — commentaire | « Commentaire » |
| Placeholder commentaire | « Décrivez ce moment… » |
| Compteur commentaire | « {n}/500 » |
| Label — partenaire | « Partenaire » + tag « Requis » |
| État sans ami | « Ajoutez un ami à votre cercle pour inscrire un moment. » |
| Label — durée | « Durée (minutes) » · placeholder « — » |
| Label — date | « Date » (segments JJ / MM / AAAA) |
| Recherche d'adresse | placeholder « Rechercher une adresse » · erreur « Adresse introuvable. » |
| Primary CTA | eyebrow « Archiver » + label « Sceller la page » · en cours « Scellement… » |
| Lien annuler | « Annuler » |
| Warn — partenaire manquant | « Vous devez taguer un partenaire pour sceller ce moment. » + `haptics.warn()` |
| Warn — GPS manquant | « Position GPS manquante. Autorisez la localisation et réessayez. » + `haptics.warn()` |
| Error — création | « Erreur : {message} » + `haptics.error()` |
| Error — réponse vide | « Création échouée — réponse vide du serveur. » |
| **Dismiss confirm (D-04)** | titre « Abandonner ce moment ? » · corps « Votre saisie ne sera pas enregistrée. » · actions [ Continuer l'écriture · Abandonner ] · `haptics.warn()` |

### Détail
| Element | Copy |
|---------|------|
| Eyebrow de page | « La page » |
| Loading | skeleton (note + barre + lignes de quote) — réutiliser `components/ui/SkeletonItem` ; spinner `ActivityIndicator` accepté en repli |
| Empty / introuvable | « Page introuvable. » |
| Clés de méta | « Lieu » · « Date » · « Durée » · « Avec » |
| Badge consentement | « En attente » / « Accepté » / « Refusé » |
| Question de consentement | « Ce moment vous concerne.\nAcceptez-vous d'y figurer ? » |
| Actions consentement | « Modifier » · « Sceller » · « Refuser ce taguage » |
| Succès consentement | « Page scellée. » + `haptics.success()` |
| Refus consentement | « Taguage refusé. » + `haptics.warn()` |
| Mode édition — eyebrow | « Modifier le moment » |
| Mode édition — CTA | « Sauvegarder et sceller » · en cours « Scellement… » |
| Mode édition — annuler | « Annuler » |
| Destructive — trigger | « Effacer cette page » (couleur `T.danger`) |
| **Destructive — confirm (Alert native)** | titre « Effacer cette page » · corps « Cette action est irréversible. » · actions [ Garder la page · Effacer (destructive) ] · `haptics.warn()` à la confirmation, `haptics.error()` si échec |

---

## Motion & Interaction Contract

| Interaction | Spec | Propriété animée |
|-------------|------|------------------|
| Présentation du sheet | slide-up natif iOS `formSheet` (aucune anim custom) | natif |
| Swipe-to-dismiss / poignée | natif iOS (`gestureEnabled: true`) | natif |
| Tap CTA / boutons d'action | `PressableScale` existant : scale 1.0→0.92 (pressIn) → 1.0 (pressOut), spring | `transform: scale` |
| Tap segment de note | feedback immédiat | `haptics.select()` (fire-and-forget) |
| Sélection chip partenaire | feedback immédiat | `haptics.select()` |
| Sceller (création réussie) | — | `haptics.success()` |
| Sceller (consentement accepté) | — | `haptics.success()` |
| Refuser le taguage | — | `haptics.warn()` |
| Confirmer suppression | — | `haptics.warn()` (succès) / `haptics.error()` (échec) |
| Ouverture FAB → création | (Phase 2) | `haptics.press()` |

**Contraintes perf (PITFALLS §Redesign 5) :** n'animer que `transform`/`opacity` ; pas de `BlurView` ; haptiques fire-and-forget (jamais `await`). Réutiliser les primitives existantes (`PressableScale`, `lib/haptics`, `AppText`) — ne pas réimplémenter.

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
| D-01 (form sheet natif, zéro dépendance) | §Design System + §Native Sheet Config |
| D-02 (détent unique ~0.9, ≥ 0.7) | §Native Sheet Config (`sheetAllowedDetents: [0.92]`) |
| D-03 (poignée + coins natifs, identité dedans) | §Native Sheet Config (`sheetGrabberVisible`, `sheetCornerRadius: 28`) |
| D-04 (confirmation « Abandonner ce moment ? ») | §Dismiss Confirmation |
| D-05 (Tabs cachés → Stack form-sheets) | §Navigation & Routing |
| D-06 (tap-pin → détail direct, Modal supprimée) | §Navigation & Routing |
| D-07 (logique métier intacte) | préservée transversalement (RPC, consentement, suppression, date) |
| D-08 (carnet sobre, pas de skeuomorphisme) | §Page Composition (création + détail) — suppression `innerBorder` |
| D-09 (création ≠ détail, traitements distincts) | §Typography (2 échelles) + §Page Composition (×2) |
| D-10 (création s'ouvre sur la NOTE) | §Page Composition — Création (ordre 1 = note) |
| Discrétion : clavier + scroll interne | §Keyboard Handling (KAV + ScrollView RN, pas gorhom) |
| Discrétion : emplacement des boutons d'action | §Action Placement (inline-fin, pas de sticky) |
| Discrétion : détent exact + `sheetCornerRadius` | §Native Sheet Config (0.92 ; 28) |
| Discrétion : mode édition + photos | conservés (Page Composition Détail, ordre 6/8) |
| Discrétion : autres entrées de création | §Navigation (FAB + long-press → même sheet) |
| Pivot D-12 (rayons iOS arrondis) | §Page Composition (tables de rayons internes) |

*Phase: 3-cr-ation-d-tail-de-point-sheets-natifs · UI-SPEC généré 2026-06-02*

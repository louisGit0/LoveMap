---
phase: 4
slug: listes-cercle
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-02
---

# Phase 4 — UI Design Contract · Listes & Cercle

> Contrat visuel et d'interaction pour la refonte des 3 écrans de listing / social selon l'archétype **« table des matières »** (gros chiffre/initiale serif à gauche, métadonnées mono alignées à droite, filet fin de séparation).
> Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
> **Périmètre :** UI-05 (`point/list` — moments), UI-06 (`friends/index` — « le cercle »), UI-07 (`friends/requests` — demandes). Une seule capacité fonctionnelle ajoutée : **retirer un ami du cercle** (D-06).
> **Refonte de présentation uniquement** : aucune nouvelle navigation, aucun nouvel écran. Logique métier (RLS, hooks) préservée.
> Langue : copie/labels en **français** ; tokens/code/structure en anglais.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (design system custom — tokens dans `constants/theme.ts`) |
| Preset | not applicable (React Native / Expo SDK 54 — shadcn ne s'applique pas) |
| Component library | react-native-paper v5 (usage réduit : `Snackbar` uniquement) + primitives maison (`components/ui/*`) |
| List engine | **`SectionList`** RN standard (groupement par mois D-02) ; `FlatList` acceptable si transform de sections faite côté écran. Zéro nouvelle dépendance. |
| Icon library | SVG custom `components/icons.tsx` (`Ico*`) — PAS de @expo/vector-icons |
| Font | Cormorant Garamond (serif italic), Inter Tight (sans), JetBrains Mono (mono) — via `constants/fonts.ts` (`F`) |
| Text primitive | `components/ui/AppText` (Dynamic Type borné par variant : `body` 2.0 / `title` 1.3 / `eyebrow` 1.2) |

**shadcn gate :** non applicable. Stack = React Native, pas React/Next.js/Vite. Aucun `components.json` (vérifié — absent). Registry safety : not applicable.

**Note de cohérence (Phase 3) :** ce contrat reprend la discipline typo **2 familles (serif + mono), 2 graisses ({300, 400})** et les rayons **D-12** (`borderCurve:'continuous'` sur toute surface arrondie) déjà actés au 03-UI-SPEC. `F.sans*` et `F.serifMedium` sont **proscrits** sur ces écrans (voir §Typography).

---

## Archetype — « Table des matières » (LOCK transverse)

Les 3 écrans partagent la même structure de ligne et la même échelle. Contrat structurel commun :

| Zone | Contenu | Alignement |
|------|---------|------------|
| **Ancre gauche** | Chiffre serif géant (note `/10`, liste) **ou** avatar carré initiale serif (cercle/demandes) | gauche, largeur fixe |
| **Corps central** | Texte primaire serif italic (commentaire / nom d'ami), `flex:1` | gauche, `numberOfLines` borné |
| **Métadonnées droite** | Mono uppercase faint (date · @username · durée) | **aligné à droite** (signature éditoriale) |
| **Action / chevron** | `Carte` underline · `›` · boutons texte | droite |
| **Séparateur** | **filet fin** `borderBottomWidth: 1`, `T.border` | pleine largeur de ligne |

- **Headers de section** = eyebrow mono uppercase (« JUIN 2026 », « DEMANDES REÇUES ») précédé d'un filet supérieur fin.
- **Titre d'écran** = grand serif italic (Title), posé en tête de liste (`ListHeaderComponent`), **pas** dans un header natif.
- **Anti-features** (FEATURES.md l.125/133/141) : pas de cartes en grille uniforme, pas de vignettes photo dominantes, pas de chips de filtre Material colorées, pas d'avatars ronds, pas de boutons pleins vert/bleu, pas de badges criards, pas de compteurs de followers.

---

## Spacing Scale

Échelle canonique — set standard **`{4, 8, 16, 24, 32, 48, 64}`**. Chaque valeur déclarée est un multiple de 4.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gap interne des pills de filtre, micro-marge `/10` vs note, marge eyebrow→meta |
| sm | 8px | Gap entre boutons d'action (Accepter/Refuser), gap meta inline, gap pills de filtre |
| lg | 16px | **paddingVertical des lignes** (row height), padding horizontal d'écran, gap par défaut, marge sous le titre |
| xl | 24px | Padding au-dessus des headers de mois/section, padding de section |
| 2xl | 32px | Ruptures majeures, `paddingBottom` au-dessus du home indicator (`insets.bottom + 32`), espacement vertical d'empty state |
| 3xl | 48px | Marge supérieure d'empty state pleine page |

**Exception unique (hors échelle principale) :**
- `rowGap = 12px` — **iOS intermediate (3×4px)** : gap horizontal entre l'ancre gauche (note/avatar) et le corps central, et padding horizontal des pills de filtre. Hérité de la convention Phase 3 (`pillPadX = 12`). Reste un multiple de 4. **Tout autre `12`/`14` doit être réaffecté** à `sm` (8) ou `lg` (16) — en particulier les `paddingVertical: 14` et `gap: 14` actuels des 3 composants sont **normalisés à 16 (lg)** et le gap à `12 (rowGap)`.

**Notes (non-spacing) :**
- Touch targets iOS ≥ 44 (tous multiples de 4) : ligne tappable ≥ 56 (16+16 padding + contenu), boutons d'action 44, pills de filtre ≥ 44 de haut.
- `letterSpacing` eyebrow 1.5–2.5 — tracking typographique (pas un token de layout).
- Insets via `useSafeAreaInsets()` (jamais `SafeAreaView`).

---

## Typography

Une **seule échelle partagée** pour les 3 écrans (même archétype). **Exactement 4 tailles**, **2 tiers de graisse** : `F.serifLight` (300) + {`F.serif` (400) / `F.mono` (400)}. Aucune `F.sans*`, aucune `F.serifMedium`.

| Role | Famille (graisse) | Size | Line Height | Usage |
|------|-------------------|------|-------------|-------|
| **Display** | `F.serifLight` (300, italic) | 44px | 44 | **Note /10** en ancre de ligne (liste, D-01). Hero de la table des matières (anchor par l'échelle, pas par la couleur). |
| **Title** | `F.serifLight` (300, italic) | 36px | 40 | Titres d'écran : « Le carnet », « Le cercle », « Demandes » |
| **Heading** | `F.serif` (400, italic) | 20px | 26 | Texte primaire de ligne : commentaire (liste), nom d'ami (cercle/demandes) ; **initiale d'avatar** ; label affirmatif « Accepter »/« Sceller » |
| **Eyebrow** | `F.mono` (400) | 10px | — | Métadonnées : `/10` denom, date, `@username`, headers de mois/section, labels de pills de filtre, durée, labels d'action ghost (« Refuser »/« Décliner »/« Carte »/« Retirer »), empty-state, compteur |

**Discipline des graisses :** chaque écran n'emploie que **{300, 400}**. `Display` + `Title` en serifLight (300, italic) ; tout le reste en serif (400, italic) ou mono (400).

**Conséquences sur l'existant (à corriger) :**
- `PointListItem` : la **note passe de 36 → 44 (Display)** et devient l'ancre gauche ; le `N°00X` mono est **supprimé** (voir §Liste). Le `arrow` `›` quitte `F.sansLight` → `F.mono` (denom/chevron mono).
- `FriendItem` / `FriendRequestItem` : `displayName` passe de `F.sans` 14 → **`F.serif` italic 20 (Heading)**.

**Dynamic Type :** `AppText` borne par variant (`title`/Display+Title+Heading ≤ 1.3 ; `eyebrow` ≤ 1.2 ; `body` ≤ 2.0). Éviter `height`/`width` fixes sur conteneurs de texte (sauf largeurs d'ancre / d'avatar, bornées).

---

## Color

Split 60/30/10 — **monochrome discipliné + un seul accent** (recommandation FEATURES.md #4).

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `T.bg` (#000000 dark / #ffffff light) | Fond d'écran et de lignes |
| Secondary (30%) | `T.surface2` / `T.border` / `T.textDim` / `T.textFaint` | Fond d'avatar (`surface2`), **filets de séparation** (`border`), métadonnées mono (`textFaint`/`textDim`), bord des pills inactives, bord du bouton ghost |
| Accent (10%) | `T.primary` (#ff2d87, identique dark/light) | voir liste réservée ci-dessous |
| Destructive | `T.danger` (#a91860 dark / #c41960 light) | **« Retirer du cercle »** uniquement (+ Alert destructive native) |

**Accent `T.primary` réservé à :**
- **Initiale d'avatar** serif italic (cercle / demandes) — verrouillé D-05 (petit, accent contenu).
- **Pill de filtre ACTIVE** (fond rose) — liste.
- **Action « Carte »** (texte + filet underline) — cercle.
- **Bouton affirmatif rempli** « Accepter » (amitié) / « Sceller » (taguage) — demandes (variant `solid`/`coral`).
- **Filet supérieur des headers de mois** (option : 1px rose discret) — liste.

**Décision de couleur — note de liste en `T.text`, PAS en rose (discrétion CONTEXT).**
La note /10 (Display 44) est l'ancre **par l'échelle**, rendue en `T.text` (et non `T.primary` comme dans l'implémentation actuelle). Rationale : une liste de ~30 lignes avec un chiffre rose géant chacune sature l'accent et casse la règle « jamais tous les éléments » + recommandation #4 (« monochrome discipliné, un seul accent »). Le rose reste contenu (initiales petites, états actifs, actions affirmatives). Le `/10` denom est en `T.textFaint` mono. *(Départ délibéré de l'existant — à respecter par l'exécuteur et le checker.)*

**Jamais « tous les éléments interactifs » en rose.** Pills inactives, chevrons, noms, dates, séparateurs, bouton ghost restent `T.text`/`T.textDim`/`T.textFaint`/`T.border`.

**Discipline thème :** tester dark **et** light sur chaque écran ; aucun hex/`fontFamily` en dur ; `makeStyles(T)` recalculé via `useMemo([T])`.

---

## Screen Composition — Liste des moments (`point/list` · UI-05)

**Archétype table des matières, groupé par mois (D-02), filtres inline (D-03).**

**Structure verticale :**
1. **Titre** « Le carnet » (Title 36 serifLight italic), `ListHeaderComponent`.
2. **Barre de filtres inline** (D-03) — voir §Filters Inline. Scrolle avec l'en-tête (dans `ListHeaderComponent`).
3. **Sections par mois** (`SectionList`) : header de section = eyebrow mono « JUIN 2026 » (uppercase, `letterSpacing` 2, `T.textFaint`, filet supérieur fin) — **sticky**. Moments triés **date décroissante** au sein de chaque section ; sections du plus récent au plus ancien.
4. **Ligne de moment** (`PointListItem`, refonte) :
   - **Ancre gauche** : note `/10` en **Display 44 (`T.text`)** + denom « /10 » mono Eyebrow `T.textFaint` (discret, sous ou à droite du chiffre). Largeur d'ancre fixe (~64) pour aligner les corps.
   - **Corps** : commentaire serif italic Heading 20 (`numberOfLines={1}`) ; fallback « Sans commentaire » (`T.textFaint`). Sous le commentaire : méta mono Eyebrow (date · `@partenaire` · adresse si présente) — alignée gauche sous le corps.
   - **Chevron** `›` mono `T.textFaint` à droite.
   - **`N°00X` SUPPRIMÉ** (D-01 : le grand chiffre est la note, pas un numéro séquentiel ; un second index encombrerait la ligne déjà ancrée par la note + la date + le header de mois).
   - Filet `borderBottom` `T.border`. Conteneur `PressableScale`, `onPress` → `haptics.tap()` + `router.push('/(app)/point/{id}')`.
5. **Préservé (D-04)** : pull-to-refresh (`RefreshControl`), skeleton `SkeletonRow` au chargement, snackbar erreur réseau.

**Rayons (D-12) :** pills de filtre `T.pill` (999) + `borderCurve:'continuous'`. Lignes sans fond/rayon (filet only).

---

## Screen Composition — Le cercle (`friends/index` · UI-06)

**Annuaire intime (D-05) + action « retirer du cercle » (D-06).**

**Structure verticale :**
1. **Titre** « Le cercle » (Title 36 serifLight italic).
2. **Recherche** : champ **underline** (réutiliser `components/ui/Input`, underline only — `borderBottomWidth:1`, `borderBottomColor:T.border`). Placeholder « Rechercher dans le cercle ». Pas de fond, pas d'icône Material.
3. **Liste d'amis** (`FriendItem`, refonte) :
   - **Avatar carré** `borderRadius:0` (inchangé), fond `T.surface2`, bord `T.border`, **initiale serif italic rose** (`T.primary`, Heading ~20). D-05 lock.
   - **Nom** serif italic Heading 20 (`T.text`) ; **`@username`** mono Eyebrow `T.textFaint`.
   - **Action « Carte »** (vue ami) : bouton **underline** discret (`variant="underline"` ou texte mono Eyebrow + filet), `T.primary`. → navigation map en mode vue ami (comportement existant conservé).
   - **Action « Retirer »** : texte mono Eyebrow **`T.danger`**, à droite (ou en swipe-action si retenu — défaut : bouton texte visible). Déclenche la confirmation éditoriale (voir §Destructive).
   - Filet `borderBottom` `T.border`.
4. **Préservé** : pull-to-refresh, skeleton, null guards (profil potentiellement null).

**Rayons (D-12) :** boutons « Carte »/« Retirer » = texte underline (pas de rayon). Avatar carré (exception D-05 conservée).

---

## Screen Composition — Demandes (`friends/requests` · UI-07)

**Deux sections à eyebrow mono (D-07).**

**Structure verticale :**
1. **Titre** « Demandes » (Title 36 serifLight italic).
2. **Section A — eyebrow « DEMANDES REÇUES »** (amitié) : lignes `FriendRequestItem` (refonte). Actions **boutons texte** : « Accepter » (affirmatif rempli) + « Refuser » (ghost). Source : `pendingReceived` (`useFriends`).
3. **Section B — eyebrow « TAGUAGES EN ATTENTE »** (consentement partenaire) : lignes équivalentes. Actions « Sceller » (affirmatif) + « Décliner » (ghost), ton aligné Phase 3 (consentement = scellement). Source : `point_partners` en attente via `is_pending_partner` (migration 010/011).
4. **Ligne de demande** : avatar carré initiale serif rose + nom serif Heading 20 + `@username` mono → puis les 2 boutons texte à droite (`gap: sm`).

**Boutons texte (remplacent les boutons-icônes actuels `IcoCheck`/`IcoClose`) :**
| Action | Variant | Typo | Couleur |
|--------|---------|------|---------|
| Accepter / Sceller (affirmatif) | `solid` / `coral` (rempli) | serif italic Heading | fond `T.primary`, texte sur rose |
| Refuser / Décliner (négatif doux) | `ghost` (bordé) | mono uppercase Eyebrow | bord `T.border`, texte `T.textDim` |

**Empty states :**
- **Les deux sections vides** → empty state unique « Pas de page en attente. » (D-07 lock), centré, mono Eyebrow + Title serif optionnel.
- **Une seule section vide** → **masquer entièrement** le header de cette section (pas de section vide affichée).

**Rayons (D-12) :** boutons remplis/bordés `T.radiusSm` (12) + `borderCurve:'continuous'`. Avatar carré.

---

## Filters Inline (LOCK · D-03)

**Suppression de l'usage de `FiltersBottomSheet` sur `list.tsx`** (zéro sheet). Le composant peut rester pour usage futur ou être supprimé s'il n'est plus référencé.

**Forme retenue (discrétion → pills) :** une rangée horizontale de pills, dans le `ListHeaderComponent` (scrolle avec le titre ; les headers de mois sont les éléments sticky).

| Groupe | Options | Comportement |
|--------|---------|--------------|
| **Note minimale** | « Toutes » · « 5+ » · « 7+ » · « 9+ » | sélection unique ; mappe l'actuel filtre 0/5/7/9 |
| **Tri** | « Date » · « Note » | toggle ; tri courant de la liste |

**Style des pills :**
- Conteneur `T.pill` (999) + `borderCurve:'continuous'`, `paddingHorizontal: rowGap (12)`, hauteur ≥ 44.
- **Active** : fond `T.primary`, label mono Eyebrow sur rose.
- **Inactive** : fond transparent, bord `T.border`, label mono Eyebrow `T.textDim`.
- Tap → `haptics.select()` (fire-and-forget).
- Aucune chip Material colorée (anti-feature FEATURES.md l.125).

---

## Destructive — Retirer du cercle (LOCK · D-06)

Capacité opt-in validée. **Confirmation obligatoire** au ton éditorial.

| Aspect | Spec |
|--------|------|
| **Trigger** | Bouton texte « Retirer » mono Eyebrow `T.danger` sur `FriendItem`. |
| **Confirmation** | **`Alert` native iOS** (style destructive). Titre « Retirer du cercle ? » · corps « {nom} ne verra plus vos moments partagés. Cette action est irréversible. » · actions **[ Garder · Retirer (destructive) ]**. |
| **Haptique** | `haptics.warn()` à l'ouverture de l'alerte ; `haptics.error()` si l'opération échoue. |
| **Hook** | `useFriends().unfriend(friendshipId)` — **déjà implémenté** (delete sur `friendships` + `removeFriend` du store). L'exécuteur câble l'UI + la confirmation ; **aucun appel Supabase dans le composant**. |
| **RLS** | Delete par `friendship.id` ; relation bidirectionnelle (requester/addressee) couverte par la RLS existante. **Règle 18** : opération mono-table (pas de récursion croisée) → sûre. |
| **Feedback succès** | Snackbar « Retiré du cercle. » + retrait optimiste de la liste (store déjà mis à jour). |
| **Feedback échec** | Snackbar « Échec — réessayez. » + `haptics.error()`. |

> L'accent rose reste réservé aux actions affirmatives ; le destructif est **`T.danger`** (cohérent avec « Effacer cette page » de la Phase 3).

---

## Copywriting Contract

Tous en français (règle 6). Ton éditorial « journal intime ».

### Liste (`point/list`)
| Element | Copy |
|---------|------|
| Titre d'écran | « Le carnet » |
| Header de mois | « JUIN 2026 » (mois + année, uppercase) |
| Filtre — note min | « Toutes » · « 5+ » · « 7+ » · « 9+ » |
| Filtre — tri | « Date » · « Note » |
| Denom de note | « /10 » |
| Commentaire absent | « Sans commentaire » |
| Empty state — titre | « Le carnet est vide. » |
| Empty state — corps | « Posez votre premier moment sur la carte. » |
| Error réseau (snackbar) | « Impossible de charger les moments. Réessayez. » |

### Le cercle (`friends/index`)
| Element | Copy |
|---------|------|
| Titre d'écran | « Le cercle » |
| Recherche (placeholder) | « Rechercher dans le cercle » |
| Action vue ami | « Carte » |
| Action retrait | « Retirer » |
| Empty state — titre | « Votre cercle est vide. » |
| Empty state — corps | « Cherchez un nom pour inviter quelqu'un. » |
| Recherche sans résultat | « Aucun nom ne correspond. » |
| **Confirm retrait (Alert native)** | titre « Retirer du cercle ? » · corps « {nom} ne verra plus vos moments partagés. Cette action est irréversible. » · actions [ Garder · Retirer (destructive) ] · `haptics.warn()` |
| Succès retrait (snackbar) | « Retiré du cercle. » |
| Échec retrait (snackbar) | « Échec — réessayez. » + `haptics.error()` |

### Demandes (`friends/requests`)
| Element | Copy |
|---------|------|
| Titre d'écran | « Demandes » |
| Eyebrow section A | « DEMANDES REÇUES » |
| Eyebrow section B | « TAGUAGES EN ATTENTE » |
| Action amitié — accepter | « Accepter » |
| Action amitié — refuser | « Refuser » |
| Action taguage — sceller | « Sceller » |
| Action taguage — décliner | « Décliner » |
| Empty state (deux sections vides) | « Pas de page en attente. » |
| Succès accept amitié | « Demande acceptée. » + `haptics.success()` |
| Refus amitié | « Demande refusée. » + `haptics.warn()` |
| Sceller taguage | « Page scellée. » + `haptics.success()` |
| Décliner taguage | « Taguage refusé. » + `haptics.warn()` |
| Error réseau (snackbar) | « Action impossible. Réessayez. » + `haptics.error()` |

---

## Component Inventory

| Composant | Action | Notes |
|-----------|--------|-------|
| `components/point/PointListItem.tsx` | **Refonte** | Note → Display 44 `T.text` (ancre) ; suppression `N°00X` ; nom/comment serif Heading ; chevron mono ; normaliser spacing (14→16/12) |
| `components/friends/FriendItem.tsx` | **Refonte** | Nom `F.sans`→serif Heading ; « Carte » underline `T.primary` ; « Retirer » mono `T.danger` + confirm éditoriale (D-06) ; avatar carré rose inchangé |
| `components/friends/FriendRequestItem.tsx` | **Refonte** | Boutons-icônes (`IcoCheck`/`IcoClose`) → **boutons texte** solid/ghost ; nom serif Heading ; props pour mapper amitié vs taguage (labels) |
| Barre de filtres inline | **Nouveau** (inline `list.tsx` ou petit composant) | Pills note-min + tri (D-03) |
| Header de mois | **Nouveau** (`renderSectionHeader`) | Eyebrow mono sticky + filet |
| `components/point/FiltersBottomSheet.tsx` | **Retirer de `list.tsx`** | Plus référencé sur cet écran (D-03) ; conserver ou supprimer selon usage résiduel |
| `components/ui/Button` | Réutiliser | variants `solid`/`coral`/`ghost`/`underline`/`danger` |
| `components/ui/Input` | Réutiliser | recherche underline |
| `components/ui/SkeletonRow` | Réutiliser | états de chargement (D-04) |
| `components/ui/PressableScale` | Réutiliser | feedback tap des lignes |
| `components/ui/AppText` | Réutiliser | Dynamic Type borné |
| `hooks/useFriends.ts` | Réutiliser tel quel | `unfriend(friendshipId)` déjà présent ; pas de nouvel appel Supabase en composant |

---

## Motion & Interaction Contract

| Interaction | Spec | Propriété / haptique |
|-------------|------|----------------------|
| Tap ligne (moment / ami) | `PressableScale` : scale 1.0→0.92→1.0 (spring) | `transform: scale` + `haptics.tap()` |
| Tap pill de filtre | feedback immédiat | `haptics.select()` (fire-and-forget) |
| Accepter demande / sceller taguage | — | `haptics.success()` |
| Refuser / décliner | — | `haptics.warn()` |
| Confirmer retrait d'ami | — | `haptics.warn()` (ouverture) / `haptics.error()` (échec) |
| Pull-to-refresh | `RefreshControl` natif | natif |
| Apparition liste / skeleton | fondu sobre `opacity` (réutiliser `SkeletonRow`) | `opacity` |

**Contraintes perf :** n'animer que `transform`/`opacity` ; **pas de `BlurView`** ; haptiques fire-and-forget (jamais `await`). Réutiliser les primitives existantes — ne pas réimplémenter. Pas de lottie/mascotte/shimmer coloré (anti-feature design system).

---

## Navigation (rappel — hors refonte)

- `point/list` et `friends/requests` sont des écrans **poussés** (Stack) → **swipe-back natif** conservé (`gestureEnabled`, acquis Phase 3). `friends/index` est une racine d'onglet (pas de back).
- Tab bar **opaque** (règle 13) inchangée. `useSafeAreaInsets()` partout (jamais `SafeAreaView`).

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
| D-01 (gros chiffre serif = note /10) | §Archetype + §Liste (Display 44, ancre) + §Typography + §Color (note `T.text`) |
| D-02 (sections par mois, eyebrow mono, date décroissante) | §Liste (`SectionList`, headers sticky) |
| D-03 (filtres inline, plus de `FiltersBottomSheet`) | §Filters Inline + §Component Inventory |
| D-04 (préserver pull-to-refresh / skeleton / snackbar) | §Liste (point 5) |
| D-05 (annuaire intime : avatar carré rose, nom serif, @ mono, « Carte » underline, recherche underline, titre « Le cercle ») | §Le cercle + §Typography + §Color (initiale rose) |
| D-06 (retrait d'ami + confirmation éditoriale destructive `T.danger`) | §Destructive + §Copywriting + `useFriends.unfriend` |
| D-07 (2 sections eyebrow, Accepter/Refuser texte solid/ghost, ton sceller/décliner, empty « Pas de page en attente ») | §Demandes + §Copywriting |
| Discrétion : tailles/espacements exacts | §Spacing + §Typography |
| Discrétion : pills vs segments | §Filters Inline (pills) |
| Discrétion : signature `unfriend` / Supabase / store | §Destructive (hook existant réutilisé, RLS règle 18) |
| Pivot D-12 (rayons iOS arrondis) | §Filters Inline + §Demandes (rayons + `borderCurve`) |
| Cohérence Phase 3 (serif+mono, 2 graisses, D-12) | §Design System + §Typography |

*Phase: 4-listes-cercle · UI-SPEC généré 2026-06-02*

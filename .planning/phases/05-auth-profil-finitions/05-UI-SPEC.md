---
phase: 5
slug: auth-profil-finitions
status: draft
shadcn_initialized: false
preset: none
created: 2026-06-02
---

# Phase 5 — UI Design Contract · Auth, Profil & Finitions

> Contrat visuel et d'interaction pour la refonte des 3 écrans d'auth/profil selon l'archétype **« page de couverture »** (grand serif italic + eyebrow mono + un CTA), **+ une passe de finitions iOS transverse** (IOS-04) sur les 9 écrans : safe areas, home indicator, Dynamic Type plafonné, sweep de cohérence tokens — clair ET sombre.
> Généré par gsd-ui-researcher, vérifié par gsd-ui-checker.
> **Périmètre :** UI-01 (`login` + `register`), UI-08 (`profile/index`), IOS-04 (audit + sweep transverse).
> **Refonte de présentation uniquement** : aucune nouvelle logique d'auth, aucune nouvelle capacité profil, aucun changement de flux (stepper register, trigger serveur, RLS, hooks préservés). Dernière phase du milestone.
> Langue : copie/labels en **français** ; tokens/code/structure en anglais.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | **none** (design system custom — tokens dans `constants/theme.ts`) |
| Preset | not applicable (React Native / Expo SDK 54 — shadcn ne s'applique pas) |
| Component library | react-native-paper v5 (usage réduit : `Snackbar` uniquement) + primitives maison (`components/ui/*`) |
| Icon library | SVG custom `components/icons.tsx` (`Ico*`, dont `IcoSun`/`IcoMoon` pour le toggle thème) — PAS de @expo/vector-icons |
| Font | Cormorant Garamond (serif italic), Inter Tight (sans), JetBrains Mono (mono) — via `constants/fonts.ts` (`F`) |
| Text primitive | `components/ui/AppText` — **levier central Dynamic Type (D-06)** : `maxFontSizeMultiplier` plafonné par variant |
| Theme pattern | `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` (dark/light, jamais de hex/`fontFamily` en dur) |

**shadcn gate :** non applicable. Stack = React Native, pas React/Next.js/Vite. Aucun `components.json` (vérifié — absent au glob `**/components.json`). Registry safety : not applicable.

**Note de cohérence (Phases 3/4) :** ce contrat **étend** la discipline typo serif+mono des phases précédentes (2 familles expressives, graisses {300, 400}) et les rayons **D-12** (`borderCurve:'continuous'` sur toute surface arrondie ≥ `radiusSm`). **Divergence assumée propre à cet archétype :** `F.sans` (Inter Tight) est **autorisé pour les valeurs/placeholders des champs de saisie et le texte d'aide fonctionnel** (e-mail, mot de passe — illisibles en serif italic) — CLAUDE.md sanctionne `F.sans` comme « corps de texte UI ». Le serif et le mono restent réservés au hero/labels éditoriaux. *(Départ délibéré du « zéro sans » de la Phase 4, qui ne portait que sur des écrans de listing sans saisie.)*

---

## Archétype — « Page de couverture » (LOCK transverse · D-01/D-02/D-03)

Les 3 écrans (+ step 1 de register) partagent la même structure de « couverture de magazine ». Contrat structurel commun :

| Zone | Contenu | Traitement |
|------|---------|------------|
| **Eyebrow de tête** | mono uppercase, `letterSpacing` 2–2.5, `T.textFaint` (ou `T.primary` si focal) | ex. « LOVEMAP · ÉDITION INTIME », « VÉRIFICATION D'ÂGE », « MOI » |
| **Hero serif** | grand titre serif italic léger (Cover 56 · `F.serifLight` 300) | nom d'app (login) · question d'âge (register step 1) · nom utilisateur (profil) |
| **Sous-hero / handle** | mono `T.textFaint` | `@username` (profil) · date/édition en ourlet |
| **Corps fonctionnel** | champs underline / contenu | **immédiatement visibles, jamais sous la ligne de flottaison** (D-01) |
| **CTA unique** | bouton plein rose (focal de la couverture) | « Se connecter », « Continuer », « Commencer le carnet » |
| **Ourlet mono** | édition / date, sobre, en bas (`T.textFaint`) | option « ÉDITION N°01 · 2026 » |

- **Whitespace généreux** : la couverture respire (rythme vertical 24/32/48), au contraire de la densité « table des matières » de la Phase 4.
- **Un seul CTA focal par écran** (recommandation FEATURES #2 : « grand serif + eyebrow + un CTA »).
- **Anti-features** (FEATURES.md l.93/149) : pas de social login en boutons colorés, pas d'onboarding multi-slides, pas de fond dégradé, pas de bento glassmorphism, pas de graphique multi-teintes, pas d'avatar rond, pas de gamification (badges/streaks).

---

## Spacing Scale

Échelle canonique héritée des Phases 3/4 — set standard **`{4, 8, 16, 24, 32, 48, 64}`**. Chaque valeur déclarée est un multiple de 4.

| Token | Value | Usage Phase 5 |
|-------|-------|---------------|
| xs | 4px | Micro-marge eyebrow→hero, gap interne unité (chiffre↔« h »), padding interne fin de tuile |
| sm | 8px | Gap label↔champ underline, gap entre actions, gap interne des barres de distribution |
| lg | 16px | Padding horizontal d'écran, **padding interne des tuiles bento**, gap par défaut, marge sous un label de section |
| xl | 24px | Espace entre champs de formulaire, espace eyebrow↔hero de couverture, gap entre tuiles bento |
| 2xl | 32px | Ruptures majeures de couverture (hero↔formulaire), espace au-dessus des sections profil, **`paddingBottom` ≈ `insets.bottom + 32`** au-dessus du home indicator |
| 3xl | 48px | Respiration de tête de couverture (sous le notch, espace solennel step 1 âge) |
| (4xl) | 64px | Réservé aux couvertures très aérées (login/step 1 plein écran) si justifié |

**Exception unique (hors échelle principale), héritée Phase 3/4 :**
- `rowGap = 12px` — **iOS intermediate (3×4px)** : `paddingHorizontal` des pills/toggles arrondis et gap fin optionnel à l'intérieur d'une tuile bento. Reste un multiple de 4. **Tout autre `12`/`14`/`18`/`20` hors-échelle rencontré pendant le sweep IOS-04 doit être réaffecté** à `sm`(8)/`lg`(16)/`xl`(24)/`2xl`(32).

**Safe areas & home indicator (D-07, contrat IOS-04) :**
- **`useSafeAreaInsets()` partout, jamais `SafeAreaView`** (règle projet). Top = `paddingTop: insets.top (+ 3xl pour les couvertures solennelles)`. Bas = `paddingBottom: insets.bottom + 32 (2xl)` pour tout contenu scrollable / au-dessus du home indicator.
- **Tab bar opaque inchangée** (règle 13) — ne jamais réintroduire de `BlurView`.
- Touch targets iOS ≥ 44 (multiples de 4) : CTA ≥ 52 de haut, toggle thème ≥ 44, zone tap avatar ≥ 44, lignes d'action compte ≥ 44.

---

## Typography

**Une échelle partagée** pour les écrans de couverture. **Exactement 4 tailles**, graisses **{300, 400}** (`F.serifLight` 300 + {`F.serif`/`F.mono`/`F.sans` 400}). Aucune `F.serifMedium`, aucune `F.sansMedium`/`F.sansSemi` (discipline 2 graisses).

| Role | Famille (graisse) | Size | Line Height | Usage |
|------|-------------------|------|-------------|-------|
| **Cover / Display** | `F.serifLight` (300, italic) | **56px** | 56 | Hero de couverture : « LoveMap » (login), question d'âge (register step 1), nom utilisateur (profil) — **+ GRANDE tuile bento = nombre de moments** (D-04). Un seul par écran. |
| **Title** | `F.serifLight` (300, italic) | **32px** | 36 | Chiffres secondaires bento (durée totale), titres de sous-section serif si requis |
| **Heading / Body serif** | `F.serif` (400, italic) | **20px** | 26 | Texte serif primaire : initiale d'avatar, label affirmatif de CTA serif (« Se connecter »), entrées de tuile (top mois) |
| **Eyebrow** | `F.mono` (400) | **10px** | — | Eyebrows de section, `@username`, labels de tuile, dates/édition d'ourlet, denom d'unité (« h », « /10 »), labels d'action compte, empty-state |

**Corps fonctionnel (exception archétype, voir §Design System) :**
- **Valeurs & placeholders de champ underline** (e-mail, mot de passe), **texte d'aide / erreurs inline** : `F.sans` (Inter Tight 400), **16px**, lineHeight 22. *(N'augmente PAS le compte de tailles « éditoriales » : c'est le corps UI fonctionnel, hors échelle expressive — comme le placeholder d'`Input` existant.)*

> **Discipline éditoriale > Phase 4 :** la Phase 4 a fixé Display **44** (ancre de ligne répétée ~30×). Ici, Display = **56** car il y a **un seul hero par écran** (couverture), il ne sature donc pas. Départ documenté et assumé (même logique que « note en `T.text` » de la Phase 4).

**Caveat AppText (Phase 4) :** `variant="title"` mappe `F.serif` (400), **pas** `F.serifLight` (300). Pour le hero Cover/Title (300), passer `fontFamily: F.serifLight` au call site **ou** utiliser le nouveau variant `display` recommandé ci-dessous.

### Dynamic Type — plafonds par rôle (D-06 · livrable central)

`AppText` est le **levier unique**. Router le texte éditorial par `AppText` (variant) ; les `Text` natifs restants doivent recevoir un `maxFontSizeMultiplier` explicite aligné sur ce tableau. **Plus serré pour le serif Display/titres, plus large pour le corps.**

| Rôle typo | Famille / size | `maxFontSizeMultiplier` cible | Route AppText |
|-----------|----------------|-------------------------------|---------------|
| **Cover / Display** (56) | `F.serifLight` | **1.15** (très serré — hero unique, ne doit jamais déborder) | **variant `display` (à ajouter)** — `F.serifLight` + cap 1.15 |
| **Title** (32) | `F.serifLight` | **1.25** | variant `title` + `fontFamily: F.serifLight` + override `maxFontSizeMultiplier={1.25}` |
| **Heading / Body serif** (20) | `F.serif` | **1.3** | variant `title` (mappe déjà `F.serif` 400, cap actuel 1.3) ✓ |
| **Body fonctionnel** (16, sans) | `F.sans` | **1.8** (accessibilité large, mais borné < 2.0 pour protéger la couverture compacte de login D-01) | variant `body` + override `maxFontSizeMultiplier={1.8}` sur les champs de couverture |
| **Eyebrow** (10) | `F.mono` | **1.2** | variant `eyebrow` (cap actuel 1.2) ✓ |

**Recommandation d'implémentation (planner/executor) :**
- **Ajouter un variant `display`** à `AppText` (`VARIANT_FONT.display = F.serifLight`, `MAX_SCALE.display = 1.15`) — l'archétype couverture est nouveau en Phase 5 et la grande tuile bento + le hero en ont besoin. Mince, sans nouvelle source de vérité typo (respecte le commentaire de tête d'`AppText`).
- État actuel d'`AppText` : `body` 2.0 / `title` 1.3 / `eyebrow` 1.2. **Ne pas baisser `body` globalement** (reste 2.0 « looser ») ; appliquer le cap 1.8 **par instance** sur les champs de couverture login/register seulement.
- Éviter `height`/`width` fixes sur conteneurs de texte (sauf largeur d'ancre d'avatar 80px, bornée). Préférer `minHeight` + `flexWrap`.

---

## Color

Split 60/30/10 — **monochrome discipliné + un seul accent** (recommandation FEATURES #4, D-04). Aucune palette multi-couleurs.

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `T.bg` (#000000 dark / #ffffff light) | Fond de couverture et de profil |
| Secondary (30%) | `T.surface` / `T.surface2` / `T.border` / `T.textDim` / `T.textFaint` | **Fond des tuiles bento** (`surface`), fond d'avatar (`surface2`), filets underline & séparateurs (`border`), **piste des barres de distribution** (`surface2`), métadonnées/eyebrows/handle mono (`textFaint`/`textDim`) |
| Accent (10%) | `T.primary` (#ff2d87, identique dark/light) | voir liste réservée ci-dessous |
| Destructive | `T.danger` (#a91860 dark / #c41960 light) | Section **« Zone irréversible »** (suppression compte) + `Alert` destructive native uniquement |

**Accent `T.primary` réservé à :**
- **Initiale d'avatar** serif italic (profil, fallback sans photo) — D-03.
- **CTA primaire rempli** (couverture) : « Se connecter », « Continuer », « Commencer le carnet » — variant `solid`/`coral`. **Un seul CTA rose par écran** (focal de couverture).
- **Remplissage des barres** de distribution des notes (monochrome+rose) — la barre sur piste `surface2`, fill `T.primary` — D-04.
- **État ACTIF du toggle thème** (IcoSun/IcoMoon sélectionné) — D-05, accent contenu.

**Le grand chiffre bento (nombre de moments, Cover 56) reste en `T.text`, PAS en rose.**
Rationale (continuité Phase 4) : le hero est l'ancre **par l'échelle**, pas par la couleur ; saturer le plus gros élément en rose contredirait « monochrome discipliné, un seul accent ». Le rose reste **contenu** (initiale, CTA, fill des barres, toggle actif). L'eyebrow d'ourlet (« LOVEMAP · ÉDITION INTIME ») reste `T.textFaint` (restraint).

**Jamais « tous les éléments » en rose.** Handles, dates, eyebrows, hero, labels de tuile, séparateurs, valeurs de champ restent `T.text`/`T.textDim`/`T.textFaint`/`T.border`.

**Discipline thème :** tester dark **et** light sur chaque écran (D-07) ; `makeStyles(T)` recalculé via `useMemo([T])` ; aucun hex/`fontFamily` en dur.

---

## Screen Composition — Connexion (`login` · UI-01 · D-01)

**Couverture de magazine, champs immédiatement visibles (PAS sous la ligne de flottaison).**

**Structure verticale (du haut) :**
1. `paddingTop: insets.top + 48 (3xl)` — respiration de tête.
2. **Eyebrow** mono « LOVEMAP · ÉDITION INTIME » (uppercase, `letterSpacing` 2.5, `T.textFaint`).
3. **Hero** « LoveMap » (Cover 56 `F.serifLight` italic `T.text`). `numberOfLines={1}`, `adjustsFontSizeToFit` non requis (cap Dynamic Type protège).
4. **Espace `2xl` (32)** → bloc formulaire **visible sans scroll** :
   - Champ **E-mail** : label mono Eyebrow « E-MAIL » + `Input` underline (`borderBottomWidth:1`, `borderBottomColor:T.border`), valeur `F.sans` 16, `keyboardType="email-address"`, `autoCapitalize="none"`.
   - Espace `xl` (24).
   - Champ **Mot de passe** : label « MOT DE PASSE » + `Input` underline `secureTextEntry`.
5. **CTA primaire** « Se connecter » (`Button` variant `solid`/`coral`, fond `T.primary`, label serif italic Heading ou mono uppercase, `borderCurve:'continuous'` `radiusSm` 12, hauteur ≥ 52). `onPress` → `haptics.tap()`.
6. **Lien secondaire** « Créer un compte » (texte mono Eyebrow `T.textDim`, underline discret) → `register`.
7. **Ourlet mono** (option, bas d'écran, `T.textFaint`) « ÉDITION N°01 · 2026 ».
8. `paddingBottom: insets.bottom + 32 (2xl)`.

**États réseau (3 obligatoires, règle 2)** : `loading` (CTA désactivé + label « Connexion… »), `success` (navigation), `error` (**Snackbar** Paper, copie ci-dessous). Pas de logique Supabase dans le composant (via `useAuth`/`authStore`).
**Clavier :** `KeyboardAvoidingView`/scroll léger pour que le CTA reste accessible clavier ouvert, sans repousser le formulaire sous la flottaison.

---

## Screen Composition — Inscription (`register` · UI-01 · D-02)

**Stepper 2 étapes CONSERVÉ (âge → formulaire). Flux, règle 10, trigger serveur `handle_new_user` INCHANGÉS. Restyle uniquement.**

### Step 1 — Âge (page de garde solennelle)
1. `paddingTop: insets.top + 48 (3xl)`, beaucoup de whitespace (ton solennel).
2. **Eyebrow** mono « VÉRIFICATION D'ÂGE » (`T.textFaint` ou `T.primary` si focal).
3. **Hero serif** (Cover 56 `F.serifLight`) — prompt d'âge éditorial (ex. « Quel âge avez-vous ? » ou saisie date de naissance JJ/MM/AAAA en champs underline selon l'implémentation existante de `authStore`).
4. Saisie : segments/champs **underline** cohérents avec le reste (pas de roue iOS brute non habillée).
5. **CTA** « Continuer » (`solid`/`coral`, ≥ 52). Bloqué si âge < `MIN_AGE` (18). `haptics.tap()` succès ; `haptics.warn()` si refus âge.
6. Erreur âge → texte d'aide `F.sans` 16 `T.danger` **ou** Snackbar.

### Step 2 — Formulaire (cohérent avec `login`)
- Même grammaire que login : eyebrow de tête, champs underline (selon champs existants : e-mail, mot de passe, username…), labels mono Eyebrow, valeurs `F.sans` 16.
- **CTA** « Commencer le carnet » (`solid`/`coral`, ≥ 52, `haptics.tap()`).
- **Bouton retour** vers step 1 (texte mono Eyebrow `T.textDim`, acquis TF2).
- 3 états réseau via `useAuth` ; erreurs Snackbar.

---

## Screen Composition — Profil (`profile/index` · UI-08 · D-03/D-04/D-05)

**Page de couverture personnelle + section « Analyse » en mini-bento éditorial. Restyle, aucun changement fonctionnel.**

### A. En-tête couverture (D-03)
1. `paddingTop: insets.top + 24/48`.
2. **Eyebrow** mono « MOI » (`T.textFaint`).
3. **Avatar carré 80px** (`borderRadius:0` — exception D-12 maintenue, fond `T.surface2`, bord `T.border`) : photo **ou** initiale serif italic rose (`T.primary`, Heading ~20–28). Tap → pick photo.
   - **Avatar upload INCHANGÉ — règles 14/15 STRICTES** : `expo-image-picker` en **require dynamique à l'intérieur de la fonction** (`try { ImagePicker = require('expo-image-picker'); } catch …`), **JAMAIS** `import * as`, **JAMAIS** `requestMediaLibraryPermissionsAsync()`. `expo-file-system/legacy` pour la lecture base64 (règle 17). Ne PAS régresser.
4. **Nom** utilisateur (Cover 56 `F.serifLight` italic `T.text`) ; **`@username`** mono Eyebrow `T.textFaint` dessous.

### B. Section « Analyse » — mini-bento (D-04 · LOCK)
Eyebrow de section mono « ANALYSE ». Grille de tuiles à **tailles variées (taille = importance, jamais volume)**. Tuiles : fond `T.surface`, `cardRadius` 16 + `borderCurve:'continuous'`, padding `lg` 16, gap inter-tuiles `xl` 24 (vertical) / `lg` 16 (horizontal). **Monochrome `T.surface*` + un seul accent `T.primary`.**

| Tuile | Taille | Contenu | Typo |
|-------|--------|---------|------|
| **A — Pages du carnet** (la PLUS grande) | **pleine largeur**, haute (~140) | **nombre de moments** = GRAND chiffre + label | chiffre **Cover 56 `T.text`** + label mono Eyebrow « PAGES DU CARNET » |
| **B — Durée totale** | demi-largeur (row 2 gauche) | durée cumulée + unité | nombre **Title 32 `T.text`** + « h » mono Eyebrow `T.textFaint` |
| **C — Mois les plus actifs** | demi-largeur (row 2 droite) | top 3 mois | liste serif Heading 20 (ou mono Eyebrow empilé) `T.textDim` |
| **D — Distribution des notes** | **pleine largeur** (row 3) | barres horizontales monochromes+rose | label mono Eyebrow ; **piste `T.surface2`, fill `T.primary`** ; denom mono `T.textFaint` |

- **Distribution (D)** : une barre par seau de note ; piste = `surface2`, remplissage = `T.primary` (seul accent), libellés/compteurs mono. **Aucune palette multi-couleurs** (anti-feature FEATURES l.149).
- **Empty state analyse** (0 moment) : tuile A affiche « 0 » + « PAGES DU CARNET » + ligne d'aide « Le carnet est encore vierge. » ; tuiles B/C/D masquées ou en état neutre « — ».

### C. Réglages & compte (D-05 — restyle, fonctionnel inchangé)
- **Toggle thème** : IcoSun/IcoMoon via `useThemeStore`, état actif `T.primary`, ≥ 44, `haptics.select()`. Eyebrow « APPARENCE » optionnel.
- **Compte** (eyebrow « COMPTE ») : « Modifier l'e-mail » / « Modifier le mot de passe » → `supabase.auth.updateUser` (via hook/handler existant, pas d'appel Supabase brut nouveau). Lignes d'action ≥ 44, label serif/mono cohérent, chevron `›` mono `T.textFaint`. Succès → `haptics.success()` + Snackbar.
- **Zone irréversible** (eyebrow « ZONE IRRÉVERSIBLE », `T.danger`) : bouton « Supprimer mon compte » `T.danger` → confirmation native (voir §Destructive).

**Préservé :** `useSafeAreaInsets`, scroll, `paddingBottom: insets.bottom + 32`.

---

## Finitions transverses — IOS-04 (D-06/D-07 · audit + sweep)

**Audit + sweep de cohérence sur les 9 écrans** — corriger les casses réelles, **ne pas réécrire ce qui est déjà cohérent.** Écrans : `login`, `register`, `map/index`, `point/new`, `point/[id]`, `point/list`, `friends/index`, `friends/requests`, `profile/index`.

| Axe | Contrat | Critère de passage |
|-----|---------|--------------------|
| **Safe areas** | `useSafeAreaInsets()` partout, **jamais `SafeAreaView`** | Aucun `SafeAreaView` résiduel ; `paddingTop: insets.top` sur tout écran de tête |
| **Home indicator** | `paddingBottom: insets.bottom + 32 (2xl)` sur contenu scrollable / boutons bas | Aucun contenu/CTA collé au bord bas ; pas sous le home indicator |
| **Tab bar** | opaque (règle 13), **pas de `BlurView`** | Inchangée |
| **Dynamic Type** | plafonds par rôle (tableau §Typography), levier `AppText` | À 1.0 ET au plafond accessibilité : aucune couverture qui déborde / tronque ; hero `display` ≤ 1.15 |
| **Sweep tokens** | aligner espacements/tailles hors-échelle sur `{4,8,16,24,32,48,64}` (+`rowGap 12`) et la famille/graisse canoniques `T.*`/`F.*` | Tout `14`/`18`/`20`/`13` de layout réaffecté ; aucun hex/`fontFamily` en dur introduit |
| **Thèmes** | clair ET sombre testés sur chaque écran | `makeStyles(T)` + `useMemo([T])` partout ; pas de couleur en dur |

> Portée du sweep = **selon ce que l'audit révèle** (discrétion CONTEXT). Ne réécrire que les déviations réelles. Dette connue documentée hors-périmètre (appels Supabase directs `requests.tsx`/`friends/index.tsx`) : **ne pas l'étendre**, ne pas la corriger ici sauf demande explicite.

---

## Copywriting Contract

Tous en français (règle 6). Ton éditorial « journal intime ». Aucun emoji.

### Connexion (`login`)
| Element | Copy |
|---------|------|
| Eyebrow de tête | « LOVEMAP · ÉDITION INTIME » |
| Hero | « LoveMap » |
| Label e-mail | « E-MAIL » |
| Label mot de passe | « MOT DE PASSE » |
| **CTA primaire** | « Se connecter » |
| CTA état loading | « Connexion… » |
| Lien secondaire | « Créer un compte » |
| Ourlet (option) | « ÉDITION N°01 · 2026 » |
| Error (snackbar) | « Connexion impossible. Vérifiez vos identifiants. » |

### Inscription (`register`)
| Element | Copy |
|---------|------|
| Step 1 — eyebrow | « VÉRIFICATION D'ÂGE » |
| Step 1 — hero | « Quel âge avez-vous ? » |
| Step 1 — aide | « Vous devez avoir 18 ans ou plus pour entrer. » |
| Step 1 — CTA | « Continuer » |
| Step 1 — refus âge | « Vous devez avoir 18 ans ou plus. » + `haptics.warn()` |
| Step 2 — **CTA primaire** | « Commencer le carnet » |
| Step 2 — retour | « Retour » |
| Error (snackbar) | « Inscription impossible. Réessayez. » |

### Profil (`profile/index`)
| Element | Copy |
|---------|------|
| Eyebrow de tête | « MOI » |
| Eyebrow analyse | « ANALYSE » |
| Grande tuile — label | « PAGES DU CARNET » |
| Tuile durée — label | « DURÉE TOTALE » |
| Tuile mois — label | « MOIS LES PLUS ACTIFS » |
| Tuile distribution — label | « DISTRIBUTION DES NOTES » |
| Empty analyse | « Le carnet est encore vierge. » |
| Eyebrow apparence | « APPARENCE » |
| Eyebrow compte | « COMPTE » |
| Action e-mail | « Modifier l'e-mail » |
| Action mot de passe | « Modifier le mot de passe » |
| Succès maj compte | « Enregistré. » + `haptics.success()` |
| Échec maj compte | « Échec — réessayez. » + `haptics.error()` |
| Eyebrow zone danger | « ZONE IRRÉVERSIBLE » |
| Bouton suppression | « Supprimer mon compte » |
| **Confirm suppression (Alert native)** | titre « Supprimer le compte ? » · corps « Toutes vos pages seront effacées. Cette action est irréversible. » · actions **[ Garder · Supprimer (destructive) ]** · `haptics.warn()` (ouverture) / `haptics.error()` (échec) |
| Succès suppression | (déconnexion + navigation auth) |

---

## Destructive — Suppression de compte (LOCK · D-05)

| Aspect | Spec |
|--------|------|
| **Trigger** | Bouton « Supprimer mon compte » mono/serif `T.danger` dans la section « Zone irréversible » (cohérent « Effacer cette page » Phase 3 + « Retirer du cercle » Phase 4). |
| **Confirmation** | **`Alert` native iOS** (style destructive). Titre « Supprimer le compte ? » · corps « Toutes vos pages seront effacées. Cette action est irréversible. » · actions **[ Garder · Supprimer (destructive) ]**. |
| **Haptique** | `haptics.warn()` à l'ouverture ; `haptics.error()` si échec. |
| **Logique** | Via le handler/hook existant (pas de nouvel appel Supabase brut dans le composant — règle 4). Fonctionnel **inchangé** (restyle only). |
| **Couleur** | `T.danger` uniquement ; le rose `T.primary` reste réservé aux actions affirmatives/accent. |

---

## Component Inventory

| Composant | Action | Notes |
|-----------|--------|-------|
| `app/(auth)/login.tsx` | **Refonte présentation** | Couverture : eyebrow + hero Cover 56 + champs underline visibles + CTA solid + ourlet (D-01). Logique `useAuth`/`authStore` inchangée |
| `app/(auth)/register.tsx` | **Refonte présentation** | Stepper 2 étapes conservé ; step 1 page de garde solennelle, step 2 cohérent login (D-02). Trigger serveur + règle 10 inchangés |
| `app/(app)/(tabs)/profile/index.tsx` | **Refonte présentation** | Couverture (avatar carré 80px + nom Cover 56 + @ mono) + bento Analyse + réglages/compte/zone irréversible restylés (D-03/04/05). Avatar = require dynamique image-picker (règles 14/15) |
| Tuiles bento Analyse | **Nouveau** (inline `profile` ou petit composant) | Grille variée ; grande tuile = nombre de moments (Cover 56) ; distribution barres `surface2`/`primary` (D-04) |
| `components/ui/AppText` | **Étendre** | Ajouter variant **`display`** (`F.serifLight`, cap 1.15) ; caps par rôle (D-06). Router le texte éditorial par AppText |
| `components/ui/Button` | Réutiliser | CTA couverture variant `solid`/`coral` ; lien secondaire `underline`/texte mono ; danger pour suppression |
| `components/ui/Input` | Réutiliser | champs underline (e-mail/mot de passe), valeur `F.sans` 16, cap Dynamic Type 1.8 |
| `components/ui/PressableScale` | Réutiliser | feedback tap CTA / lignes d'action / avatar |
| `components/icons.tsx` (`IcoSun`/`IcoMoon`) | Réutiliser | toggle thème, état actif `T.primary` |
| 9 écrans (IOS-04) | **Audit + sweep** | safe areas / home indicator / Dynamic Type caps / tokens / dark+light — corriger casses réelles uniquement (D-07) |

---

## Motion & Interaction Contract

| Interaction | Spec | Propriété / haptique |
|-------------|------|----------------------|
| Tap CTA primaire (Se connecter / Continuer / Commencer) | `PressableScale` (spring) | `transform: scale` + `haptics.tap()` |
| Refus âge (step 1) | — | `haptics.warn()` |
| Tap avatar (pick photo) | `PressableScale` | `transform: scale` + `haptics.tap()` |
| Toggle thème | bascule immédiate | `haptics.select()` (fire-and-forget) |
| Tap ligne d'action compte (e-mail/mdp) | `PressableScale` | `transform: scale` + `haptics.tap()` |
| Succès maj e-mail/mdp | — | `haptics.success()` |
| Ouverture Alert suppression | — | `haptics.warn()` |
| Échec (réseau / suppression) | — | `haptics.error()` |
| Apparition couverture (option) | fondu + translate léger sobre | `opacity` (+ `transform: translateY`) |

**Contraintes perf (héritées) :** n'animer que `transform`/`opacity` ; **pas de `BlurView`** ; haptiques fire-and-forget (jamais `await`). Réutiliser les primitives existantes. **Pas de lottie/mascotte/shimmer coloré** (anti-feature design system, recommandation FEATURES #5).

---

## Navigation (rappel — hors refonte)

- `login`/`register` = groupe `(auth)` non protégé ; `register` step 1↔2 géré en interne (state). `profile/index` = racine d'onglet (pas de back, tab bar opaque règle 13).
- `useSafeAreaInsets()` partout (jamais `SafeAreaView`). Tab bar opaque inchangée (règle 13).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| (aucun) | — | not applicable — pas de shadcn/registry sur React Native (aucun `components.json`) |

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
| D-01 (login : en-tête éditorial compact + champs immédiatement visibles, ourlet mono, Snackbar) | §Archétype + §Connexion + §Typography (Cover 56) + §Copywriting |
| D-02 (register : stepper conservé, step 1 page de garde solennelle, step 2 cohérent login, restyle only) | §Inscription + §Component Inventory |
| D-03 (profil : couverture, avatar carré 80px rose, nom serif, @ mono ; avatar require dynamique règles 14/15) | §Profil A + §Component Inventory |
| D-04 (Analyse mini-bento, GRANDE tuile = nombre de moments, monochrome+rose, taille=importance) | §Profil B + §Color + §Typography |
| D-05 (toggle thème, email/mdp updateUser, Zone irréversible — restyle) | §Profil C + §Destructive + §Copywriting |
| D-06 (Dynamic Type plafonné par rôle, levier AppText, caps serif serrés / corps larges) | §Typography (tableau caps) + §Finitions IOS-04 |
| D-07 (audit + sweep 9 écrans : safe areas, home indicator, Dynamic Type, tokens, clair+sombre) | §Finitions IOS-04 |
| Discrétion : plafonds exacts `maxFontSizeMultiplier` | §Typography (1.15/1.25/1.3/1.8/1.2) |
| Discrétion : disposition bento (grille, tailles) | §Profil B (A pleine/B-C demi/D pleine) |
| Discrétion : écrans du sweep | §Finitions IOS-04 (selon audit) |
| Cohérence Phases 3/4 (serif+mono, graisses {300,400}, D-12 `borderCurve`) | §Design System + §Typography + §Spacing |
| Anti-features (FEATURES l.93/149) | §Archétype + §Profil B + §Color |

*Phase: 5-auth-profil-finitions · UI-SPEC généré 2026-06-02*

# Design Features Research

> Recherche design pour la refonte des 9 écrans de LoveMap (auth login/register, map, point create/detail/list, friends, requests, profile).
> Direction visée : **éditorial × iOS hybride** — marier l'identité éditoriale forte (noir `#000` / rose `#ff2d87`, Cormorant Garamond italic, Inter Tight, JetBrains Mono, angles francs radius 4, zéro emoji, ton journal intime FR) avec le confort d'usage natif iOS.
> Sources web vérifiées (2025/2026) listées en fin de document. Niveaux de confiance indiqués où pertinent.

---

## Editorial × iOS Hybrid (techniques)

Le principe directeur de la direction hybride : **garder la structure de navigation et les gestes natifs iOS (ce que l'utilisateur connaît déjà), et investir tout le caractère éditorial dans le contenu et la typographie.** La règle communément admise en 2025 est de « unifier ce qui est universel, adapter ce qui est attendu » — donc ne jamais réinventer la barre d'onglets, la barre de navigation ou les sheets, mais traiter chaque surface de contenu comme une page de magazine. *(Confiance : élevée)*

### Les 4 leviers concrets à exploiter

1. **Hiérarchie par contraste d'échelle (le levier n°1).**
   L'éditorial se reconnaît à l'écart brutal entre un très grand titre serif (38–64px, `F.serifLight`) et un corps de texte petit et calme (`F.sans` 15–16px). Cet écart — et non une multitude de tailles intermédiaires — crée la sensation « magazine ». Les eyebrows mono (`F.mono`, 9–10px, letterSpacing 2–2.5, uppercase) servent d'étiquette de rubrique au-dessus du titre, exactement comme un kicker de presse. *(Confiance : élevée)*

2. **Whitespace généreux et asymétrique, pas du padding uniforme.**
   Le style suisse traite l'espacement comme un contrat : choisir une unité de base (8px) et n'utiliser que ses multiples. Mais l'éditorial ajoute le **rythme** : marges hautes plus larges que les marges latérales, respiration verticale variable entre les blocs selon leur importance. À fuir absolument : le padding identique partout, qui signe le template.

3. **Tension angles francs (marque) × coins arrondis (iOS).**
   LoveMap impose radius 4 (angles francs) sur ses cartes et avatars carrés. Pour ne pas heurter le natif, la stratégie gagnante est de **réserver l'arrondi iOS aux seuls éléments système** (sheets modales avec coin haut arrondi, boutons système, tab bar) et de **garder les angles francs sur tout le contenu de marque** (cartes de point, avatars, blocs de stats). Cette cohabitation assumée est elle-même un signal de design intentionnel.

4. **Surfaces en couches (layering) sobre.**
   Plutôt que des ombres portées génériques, l'éditorial empile par **valeur** : `T.bg` (#000) → `T.surface` (#0a0a0a) → `T.surface2` (#141414), séparés par `T.border` (#1f1f1f) en filet de 1px. Le rose `#ff2d87` n'est jamais une couleur décorative de fond : c'est une encre d'accent (initiales d'avatar, numéro de page, état actif), utilisée avec parcimonie. C'est exactement la logique « dark luxury » 2025 : fond très sombre + un seul accent saturé + filets fins. *(Confiance : élevée)*

### Références de catégories à étudier
- **Dark luxury** : fond noir/quasi-noir, accent unique saturé, contraste discipliné, typographie comme seul ornement. Correspond directement à la palette LoveMap.
- **Éditorial / magazine** : kicker mono + titre serif + filets, pull-quotes, numérotation d'articles, tables des matières.
- **Suisse / International** : grille stricte 8px, sans-serif neutre pour l'UI fonctionnelle, espace blanc comme élément actif, « casser » la grille ponctuellement pour souligner un élément clé.

> **Ce qu'il NE faut PAS faire (anti-pattern transversal) :** ajouter des dégradés/blobs roses, des ombres douces partout, des cartes uniformes en grille régulière sans hiérarchie, ou utiliser le serif italic pour du corps de texte long (illisible — le serif reste réservé aux titres, citations et commentaires courts).

---

## Map UI

L'écran carte est le cœur de LoveMap mais aussi le plus difficile à « éditorialiser » : une carte Mapbox est par nature un objet générique. La marque doit donc vivre **dans les sur-couches (overlays) et les contrôles**, jamais dans la carte elle-même (au-delà du style de tuiles `dark-v11`). *(Confiance : élevée)*

### Table stakes (indispensable, sinon l'app paraît cassée)
- **Carte toujours visible**, plein écran, sans condition (déjà une règle projet — règle métier critique). Hint non-bloquant si aucun point.
- **Détail de point en bottom sheet** déclenché au tap sur un pin. Pattern attendu en 2025 : carte de détail qui glisse depuis le bas, avec une « grabber » (poignée) en haut, drag pour agrandir, swipe pour fermer. Préférer le **non-modal** (la carte reste interactive derrière) pour la consultation, réserver le **modal + dimming** aux tâches qui interrompent le flux (création).
- **Contrôles flottants dans le tiers inférieur** (zone du pouce) : le FAB de création et le toggle pins/heatmap doivent tomber dans l'arc naturel du pouce.
- **Ajustement de la caméra quand le sheet monte** : recentrer le pin sélectionné au-dessus du sheet (sinon il est masqué).

### Différenciateurs (ce qui rend la carte « LoveMap » et non « une carte »)
- **FAB éditorial, pas un cercle Material.** Un bouton pilule ou carré (radius 4) rose `coral` avec label mono court (« POSER » / « + ») plutôt qu'un FAB rond flottant standard. C'est le détail qui sort du template.
- **Overlay header en filet, pas une barre pleine.** Le toggle pins/heatmap traité comme un segmented control custom : labels mono uppercase, soulignement rose sur l'état actif, fond translucide léger plutôt qu'opaque.
- **Bottom sheet de détail traité comme une page de carnet** : eyebrow mono (« N°007 · le 12 mars »), note /10 en gros chiffre serif, commentaire en serif italic entre guillemets, métadonnées (durée, partenaire) en mono. Le sheet devient une mini-page éditoriale.
- **Pins comme typographie/numéro** plutôt que goutte d'eau générique : marqueur carré rose avec le numéro de moment, ou point serti minimal. Cohérent avec l'identité « N°001 ».
- **Heatmap dans la palette de marque** : rampe de couleur partant du noir vers le rose `#ff2d87` (et non le bleu→rouge par défaut). Petit détail, fort impact d'appartenance.

> **Anti-features carte :** pas de cluster bubbles Material colorées, pas de FAB rond standard, pas de panneau latéral de filtres (sidebar) — sur mobile, préférer un sheet de filtres. Pas de carte d'aperçu opaque qui masque la moitié de l'écran ; le sheet doit s'ouvrir à ~40% par défaut.

---

## Empty States & Micro-interactions

C'est le terrain où LoveMap peut le plus se démarquer à faible coût, car les empty states génériques (illustration mignonne + « Rien ici ! ») trahissent immédiatement le template. La recherche 2025 confirme que des empty states contextuels réduisent la confusion (~50%) — mais pour LoveMap, ils doivent surtout **porter la voix éditoriale**. *(Confiance : moyenne-élevée)*

### Empty states éditoriaux (différenciateur fort)
- **Pas d'illustration, du texte de carnet.** Un empty state LoveMap = eyebrow mono + une phrase serif italic au ton journal intime + un CTA discret. Exemples de copie cohérents avec l'existant :
  - Carte sans point : « *Le carnet est vierge.* » + « Posez votre première page. »
  - Liste vide : « *Aucune page scellée pour l'instant.* »
  - Cercle vide : « *Le cercle est encore fermé.* »
  - Demandes vides : « *Pas de page en attente.* »
- **Hiérarchie typographique** plutôt qu'image : le grand serif italic centré, l'espace blanc, et un seul accent rose sur le CTA. C'est plus mémorable et 100% on-brand.

### Skeleton loaders (déjà présent — à raffiner)
- Le `SkeletonItem.tsx` existant (pulse Animated.loop) est la bonne approche : préférer **toujours le skeleton au spinner** pour le contenu structuré (perçu plus rapide, construit le modèle mental de la page). Garder le shimmer **monochrome sobre** (variations de `T.surface`/`T.surface2`), surtout pas un shimmer coloré.
- Les blocs skeleton doivent **épouser la forme finale** : un rectangle pour l'avatar carré, une ligne large pour le titre serif, deux lignes fines pour les métadonnées mono.

### Micro-interactions (table stakes + différenciateurs)
- **`PressableScale` (déjà en place)** : scale spring au press, à généraliser sur toutes les cartes/boutons. C'est le minimum attendu en 2025 (feedback tactile).
- **`expo-haptics` (déjà en place)** : retour haptique sur actions clés — création de point, consentement partenaire, toggle thème. À utiliser avec parcimonie (impact léger), réservé aux moments « scellement ».
- **Transitions de page éditoriales** : favoriser des transitions sobres (fondu + léger translate vertical) plutôt que des slides système bruyants, pour le passage liste → détail. Le numéro de page (N°007) peut servir d'élément de continuité visuelle.
- **Validation inline des champs** (date JJ/MM/AAAA, note) avec micro-feedback immédiat, plutôt qu'une erreur après soumission.

> **Anti-patterns :** spinners pleine page, illustrations stock/mascotte (anti-thèse du ton intime), animations de chargement « ludiques » type Duolingo (totalement hors-sujet pour une app intime adulte), shimmer coloré, lottie génériques.

---

## Per-Screen Opportunities

Pour chaque écran : **table stakes** (le minimum pour ne pas paraître cassé/générique), **différenciateurs** (le traitement éditorial × iOS qui élève), **anti-features** (à ne délibérément PAS faire).

### Auth — login / register

| | |
|---|---|
| **Table stakes** | Champs underline-only (déjà la convention), bouton retour, gestion erreur via Snackbar, register en stepper 2 étapes (âge → formulaire) déjà en place. |
| **Différenciateurs** | Écran d'accueil comme **couverture de magazine** : grand titre serif italic, eyebrow mono (« LOVEMAP · ÉDITION INTIME »), zéro champ visible au-dessus de la ligne de flottaison sauf le CTA. Numéro d'édition / date en mono comme un ourlet de couverture. Step 1 de register (âge) traité comme une page de garde solennelle. |
| **Anti-features** | Pas de social login en gros boutons colorés (casse le ton), pas d'illustration onboarding multi-slides, pas de fond dégradé. |

### Map

| | |
|---|---|
| **Table stakes** | Carte plein écran toujours visible, FAB dans la zone pouce, sheet de détail au tap, recentrage caméra. |
| **Différenciateurs** | FAB pilule/carré rose à label mono, header-toggle en filet (segmented custom), pins numérotés, heatmap noir→rose, sheet détail = page de carnet. |
| **Anti-features** | FAB rond Material, clusters colorés, sidebar de filtres, sheet opaque plein écran. |

### Point — create (form)

| | |
|---|---|
| **Table stakes** | Partenaire **obligatoire** (règle projet), CTA désactivé si 0 ami, date saisie JJ/MM/AAAA (jamais `new Date()`), 3 états réseau, création via RPC `create_point`. |
| **Différenciateurs** | Formulaire en **mode rédaction de page** : sections espacées avec eyebrows mono (« LE LIEU », « LA NOTE », « LA PAGE »), note /10 saisie via un sélecteur éditorial (gros chiffre serif qui change), commentaire en champ serif italic. CTA final « Sceller la page » (copie existante). Sheet modale + dimming (tâche qui interrompt). |
| **Anti-features** | Pas de slider note coloré générique, pas de date picker roue iOS brut sans habillage, pas de formulaire dense en une page sans rythme. |

### Point — detail ([id])

| | |
|---|---|
| **Table stakes** | Affichage note/commentaire/durée/date, flux consentement partenaire, vérif `creator_id`. |
| **Différenciateurs** | Mise en page **pleine page éditoriale** : N°00X mono en haut, date serif, note /10 en très grand serif, commentaire en pull-quote serif italic avec guillemets `F.serifMedium`, partenaire en ligne mono. Zone consentement traitée avec gravité (« Page en attente de sceau »). Bouton suppression « EFFACER » / « Zone irréversible » (copie existante). |
| **Anti-features** | Pas de carrousel photo générique, pas de boutons d'action flottants Material, pas d'icônes émoji de statut. |

### Point — list

| | |
|---|---|
| **Table stakes** | Liste chronologique, filtres (note min, tri), pull-to-refresh, skeleton, snackbar erreur (déjà en place). |
| **Différenciateurs** | Liste comme **table des matières de magazine** : gros numéro de moment à gauche (N°001…), titre/lieu en serif, date en mono à droite alignée, filet fin de séparation. Oversized numbers + alignement droit des métadonnées = signature éditoriale directe. Header de section par mois en eyebrow mono. Filtres en bottom sheet (`FiltersBottomSheet` existant). |
| **Anti-features** | Pas de cartes en grille uniforme, pas de vignettes photo dominantes, pas de chips de filtre Material colorées. |

### Friends — « le cercle »

| | |
|---|---|
| **Table stakes** | Liste amis + recherche, bouton « Carte » par ami (vue ami), pull-to-refresh, skeleton, null guards. |
| **Différenciateurs** | Chaque `FriendItem` comme **entrée d'annuaire intime** : avatar carré (initiale serif italic rose), nom en serif, handle/username en mono, action « Carte » en bouton underline discret. Titre d'écran « Le cercle » en grand serif. Recherche en champ underline. |
| **Anti-features** | Pas d'avatars ronds, pas de boutons « Ajouter » verts/bleus pleins, pas de liste façon réseau social avec compteurs de followers. |

### Requests (demandes)

| | |
|---|---|
| **Table stakes** | Demandes d'amitié reçues/envoyées, section taguages partenaire en attente (migration 010), null guards. |
| **Différenciateurs** | Deux sections claires avec eyebrows mono (« DEMANDES REÇUES », « TAGUAGES EN ATTENTE »). Chaque demande = ligne éditoriale avec actions Accepter/Refuser en boutons texte (solid / ghost), ton « sceller / décliner ». État vide « Pas de page en attente ». |
| **Anti-features** | Pas de boutons ronds vert/rouge, pas de badges de notification criards. |

### Profile — « Moi » (settings fusionné)

| | |
|---|---|
| **Table stakes** | Stats, toggle thème (IcoSun/IcoMoon), édition email/mdp/suppression compte, avatar upload (ImagePicker en **require dynamique dans la fonction** — règle 14/15 stricte), section « Analyse » (distribution notes, top 3 mois, durée totale). |
| **Différenciateurs** | **Profil comme page de couverture personnelle** : avatar carré 80px, nom en grand serif, handle mono. Section « Analyse » en **mini-bento éditorial** — tuiles de tailles variées (la durée totale en grande tuile, distribution des notes en barres monochromes+rose, top mois en petites tuiles), taille = importance de la donnée. Les chiffres clés en gros serif, labels en mono. Toggle thème intégré sobrement. Section « Zone irréversible » pour la suppression. |
| **Anti-features** | Pas de bento glassmorphism (incohérent avec angles francs), pas de graphiques colorés multi-teintes (rester monochrome + rose), pas de gamification (badges, streaks), avatar non rond. |

---

## Recommendations

1. **Adopter explicitement la règle « navigation native, contenu éditorial ».** Geler les patterns iOS sur la coquille (tab bar opaque déjà actée règle 13, sheets système, gestes), et concentrer 100% de l'effort de marque sur la typographie, les eyebrows mono, les numéros de page et le whitespace. C'est le moyen le plus sûr d'obtenir un rendu « intentionnel » sans friction d'usage. *(Confiance : élevée)*

2. **Standardiser 3 archétypes de composition réutilisables** plutôt que redessiner 9 écrans isolément :
   - *La page de couverture* (auth accueil, profil, step âge) — grand serif + eyebrow + un CTA.
   - *La table des matières* (liste points, cercle, requests) — gros numéro/initiale + serif + métadonnées mono alignées droite + filet.
   - *La page de carnet* (détail point, sheet carte, form création) — N°00X, note serif géante, pull-quote serif italic, métadonnées mono.
   Ces 3 patterns couvrent les 9 écrans et garantissent la cohérence.

3. **Investir tôt dans les empty states et le sheet de détail carte**, qui sont les deux surfaces à plus fort retour de différenciation pour un coût faible. Réécrire toutes les copies vides en ton journal intime FR, et traiter le bottom sheet de point comme une mini-page éditoriale (c'est le moment où l'utilisateur « lit » son moment). *(Confiance : moyenne-élevée)*

4. **Garder le monochrome discipliné.** Toute data-viz (analyse profil, heatmap) doit rester en niveaux de `T.surface` + un seul accent `#ff2d87`. Refuser toute palette multi-couleurs : c'est ce qui distingue le « dark luxury éditorial » du dashboard générique. Tile size = importance de la donnée (principe bento), jamais volume.

5. **Définir des tokens de motion** (durées + easing) au même titre que les tokens de couleur/typo : transitions sobres (fondu + translate léger), haptique réservé aux moments de « scellement », skeleton monochrome. Inscrire « pas de lottie/mascotte/shimmer coloré » comme anti-feature formelle dans le design system.

---

## Sources

- [UI/UX Design Trends in Mobile Apps for 2025 — Chop Dawg](https://www.chopdawg.com/ui-ux-design-trends-in-mobile-apps-for-2025/)
- [Typography Trends 2025 — Today Made](https://www.todaymade.com/blog/typography-trends)
- [iOS App Design Guidelines 2025 — Tapptitude](https://tapptitude.com/blog/i-os-app-design-guidelines-for-2025)
- [Bottom Sheet UI Design — Mobbin](https://mobbin.com/glossary/bottom-sheet)
- [Bottom Sheets: Definition and UX Guidelines — Nielsen Norman Group](https://www.nngroup.com/articles/bottom-sheet/)
- [Map UI Design: Best Practices — Eleken](https://www.eleken.co/blog-posts/map-ui-design)
- [7 UI Design Ideas for Mapping Applications — Map Library](https://www.maplibrary.org/10501/7-ui-design-ideas-for-mapping-applications/)
- [Adjusting Compose Google Map While Bottom Sheet Moves — Turo Engineering](https://medium.com/turo-engineering/adjusting-compose-google-map-while-bottom-sheet-moves-4a7465305137)
- [9 Mobile App UI Design Best Practices for 2025 — NextNative](https://nextnative.dev/blog/mobile-app-ui-design-best-practices)
- [Skeleton loading screen design — LogRocket](https://blog.logrocket.com/ux-design/skeleton-loading-screen-design/)
- [Skeleton Screens vs Loading Spinners — Onething Design](https://www.onething.design/post/skeleton-screens-vs-loading-spinners)
- [12 Micro Animation Examples 2025 — Bricx Labs](https://bricxlabs.com/blogs/micro-interactions-2025-examples)
- [Motion Design & Micro-Interactions: What Users Expect in 2026 — Techqware](https://www.techqware.com/blog/motion-design-micro-interactions-what-users-expect)
- [Swiss Web Design Guide 2025 — Pixel Darts](https://www.pixeldarts.com/post/swiss-style-web-design-a-comprehensive-guide)
- [Implementing Swiss Design Principles in Modern App UI — Medium](https://medium.com/@tunmie/implementing-swiss-design-principles-in-modern-app-ui-e5db0e551bd5)
- [Ultimate guide to table of contents design — Icons8](https://icons8.com/blog/articles/ultimate-guide-to-table-of-contents-design/)
- [Bento Grid Dashboard Design: Complete Guide 2026 — Orbix Studio](https://www.orbix.studio/blogs/bento-grid-dashboard-design-aesthetics)
- [Understanding Modals and Sheets, Native iOS Design Patterns — Medium](https://medium.com/@jiachunl/native-ios-design-pattern-modals-and-sheets-22b5929d1429)
- [Get to know the new design system — WWDC25, Apple](https://developer.apple.com/videos/play/wwdc2025/356/)

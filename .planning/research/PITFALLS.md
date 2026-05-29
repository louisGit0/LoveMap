# Pitfalls Research

> Recherche menée en mai 2026 pour le chantier UI/UX (restylage carte + clustering, sheets natives, gestes, refonte plein écran).
> Stack vérifiée dans `package.json` / `app.json` : Expo SDK 54, React Native 0.81.5, React 19.1.0, `@rnmapbox/maps` ^10.3.1, `expo-router` ~6.0.23, `react-native-screens` ~4.16.0, `react-native-safe-area-context` ~5.6.0, Zustand ^4.5.4, `react-native-paper` ^5.12.3.
> **Nouvelle Architecture activée par défaut sous SDK 54.**
>
> **Constats structurants tirés du repo (à garder en tête pour tout le chantier) :**
> - `react-native-reanimated` et `react-native-gesture-handler` **ne sont PAS installés** aujourd'hui. Toute animation/geste avancé du redesign les introduira → ce sont des modules **natifs** (rebuild obligatoire, pas d'OTA).
> - `app.json` utilise `"runtimeVersion": "1.0.0"` (chaîne statique, **pas** la policy `fingerprint`). C'est le piège n°1 du chantier (voir section Refonte).
> - `babel.config.js` n'a qu'un `module-resolver` ; aucun plugin Reanimated/Worklets — cohérent avec leur absence actuelle.

---

## Clustering Migration

Le chantier veut passer de `PointAnnotation` à un rendu `ShapeSource` + clustering. C'est le bon choix de performance (au-delà de ~50 points, `PointAnnotation` rend chaque enfant React sur un bitmap et devient coûteux), mais plusieurs pièges spécifiques à `@rnmapbox/maps` v10 sur iOS.

### 1. `ShapeSource.onPress` capricieux sur iOS / mauvaise zone de hit
**Description.** Historiquement le `onPress` d'un `ShapeSource` ne se déclenchait pas sur iOS (issue #1746), et inversement il se déclenche parfois en dehors de la géométrie (issue #2913). Le binding du tap sur une source vectorielle est moins fiable que le `onSelected` d'un `PointAnnotation`/`PointAnnotation` actuel.
**Signes d'alerte.** En test sur device iOS, taper un pin n'ouvre pas le détail alors que ça marche en simulateur Android ; ou un tap dans le vide ouvre un point au hasard.
**Prévention.**
- Mettre le `onPress` **sur le `ShapeSource`** (pas sur le `SymbolLayer`/`CircleLayer`) et lire `event.features` pour distinguer cluster (`properties.cluster === true`) vs point individuel.
- Tester systématiquement sur **device physique iOS** (TestFlight), pas seulement simulateur — c'est la divergence la plus fréquente.
- Garder un `hitbox`/rayon de tap généreux ; valider que `id`/`creator_id` remontent bien dans `properties` (les propriétés custom doivent être sérialisables dans le GeoJSON, pas des objets imbriqués).
**Zone du chantier.** Restylage carte + clustering (interaction tap → `point/[id]`).

### 2. `getClusterExpansionZoom` lève une erreur sur iOS
**Description.** Issue #2001 : sur iOS v10, `ShapeSource.getClusterExpansionZoom(feature)` jette une erreur quand on lui passe une `Feature` complète (signature attendue parfois `clusterId` numérique). Sans ça, taper un cluster ne sait pas jusqu'où dézoomer.
**Signes d'alerte.** Tap sur cluster → exception non catchée / le cluster ne s'ouvre pas en zoomant.
**Prévention.**
```ts
// Passer l'objet feature OU l'id selon la version — tester les deux et wrapper en try/catch.
async function onClusterPress(feature) {
  const sourceRef = shapeSourceRef.current;
  try {
    const zoom = await sourceRef.getClusterExpansionZoom(feature);
    cameraRef.current?.setCamera({
      centerCoordinate: feature.geometry.coordinates,
      zoomLevel: zoom * 1.15,
      animationMode: 'easeTo',
      animationDuration: 700,
    });
  } catch (e) {
    // fallback : zoom + 2 sur la position du cluster, et remonter l'erreur en snackbar
  }
}
```
- Toujours envelopper dans `try/catch` et prévoir un fallback (zoom relatif), conformément à la règle « 3 états réseau / erreurs visibles ».
**Zone du chantier.** Clustering (expansion au tap).

### 3. `clusterProperties` non transmis (divergence plateforme)
**Description.** Issue #3902 : `clusterProperties` sur `ShapeSource` ne sont pas appliqués sur Android (absents des events de press, des filtres et des styles dépendant d'eux). Si le design veut agréger une stat par cluster (ex. note moyenne, nombre de partenaires), ça peut ne pas fonctionner de façon homogène.
**Signes d'alerte.** Le badge/couleur du cluster basé sur une propriété agrégée reste constant ou vide.
**Prévention.** S'appuyer sur la propriété native fiable `point_count` (et `point_count_abbreviated`) pour le compteur. Pour toute agrégation custom, prévoir un calcul JS côté client (supercluster) en repli plutôt que de dépendre de `clusterProperties`.
**Zone du chantier.** Clustering (badges/labels de cluster).

### 4. Perte du look custom des marqueurs (le vrai coût du passage à `SymbolLayer`)
**Description.** L'identité visuelle LoveMap utilise des marqueurs custom (rose `#ff2d87`, angles francs, typo serif). Avec `ShapeSource`+`SymbolLayer`, on ne rend plus des **Views React** mais des **icônes raster** déclarées via le composant `Images`. On perd donc le rendu vectoriel/typographique direct ; il faut fournir des PNG/sprites ou des SVG pré-rastérisés.
**Signes d'alerte.** Pendant le portage, les pins redeviennent des cercles génériques Mapbox ou la couleur de la charte n'est plus respectée.
**Prévention.**
- Construire un petit set d'icônes (pin individuel + bulles de cluster par paliers) en PNG @1x/@2x/@3x ou via `Images`/`ShapeSource`+`CircleLayer` stylé aux tokens (`T.primary`, `T.bg`).
- Si un marqueur **interactif riche** est indispensable (ex. avatar du partenaire dans le pin), garder `PointAnnotation`/`MarkerView` **uniquement pour le point sélectionné**, et `SymbolLayer`/`CircleLayer` pour la masse — approche hybride. Doc officielle : « many static points → ShapeSource/SymbolLayer ; interactive view → MarkerView ».
- Ne pas mélanger `MarkerView` sur la masse (rappel : régression connue du projet, `MarkerView` disparaissait au dézoom → migré vers `PointAnnotation`).
**Zone du chantier.** Restylage carte (cohérence charte).

### 5. Clusters invisibles en simulateur iOS / rendu après chargement de style
**Description.** Discussion #3549 : clusters non affichés en simulateur iOS ; plus largement, les `SymbolLayer`/`Images` peuvent ne rien rendre si l'icône référencée n'est pas chargée au moment où la couche s'affiche, ou si le style de la carte n'est pas encore prêt.
**Signes d'alerte.** Carte vide de pins au premier rendu, qui apparaissent après un pan/zoom ou un reload.
**Prévention.** Déclarer les `Images` **avant** le `SymbolLayer` qui les consomme, attendre `onDidFinishLoadingStyle` avant d'injecter la source si besoin, et valider sur **device** (le simulateur ment sur ce point précis).
**Zone du chantier.** Clustering / restylage carte (premier rendu).

---

## Native Sheets

Le chantier envisage des bottom sheets / `formSheet`. Deux familles : sheets natives via `expo-router` (`presentation: 'formSheet'`, qui s'appuie sur `react-native-screens`) ou `@gorhom/bottom-sheet`. Les deux ont des pièges marqués sous iOS 26 / SDK 54.

### 1. `formSheet` rendu trop petit sur iOS 26
**Description.** Issue react-native-screens #3235 et expo #35616 : sous **iOS 26 + Expo 54** (donc exactement notre cible), un `formSheet` occupant moins de la moitié de l'écran se rend trop petit / ancré en bas, ne remplit pas la largeur attendue. Reproductible avec detents fixes **et** `fitToContents`. `react-native-screens` **4.16.0** (notre version exacte) est citée comme affectée. Bug ouvert en septembre 2025, pas de version de fix confirmée au moment de la recherche.
**Signes d'alerte.** Sur device iOS 26, la sheet de création de point / détail apparaît rabougrie, contenu coupé, padding incohérent device vs simulateur (issue #42904).
**Prévention.**
- Si possible **épingler `react-native-screens`** à une version corrigée dès qu'elle sort ; suivre l'issue #3235.
- Utiliser un detent ≥ 0.7 (le bug s'atténue aux grands detents) ou un detent `large` plein écran tant que ce n'est pas patché.
- Tester impérativement sur **device iOS 26** + simulateur (le rendu diffère). Ne pas valider un layout de sheet uniquement au simulateur.
- Solution de repli : `@gorhom/bottom-sheet` (rendu JS, non soumis à ce bug natif iOS 26) — au prix d'introduire gesture-handler/reanimated (voir section Gestes).
**Zone du chantier.** Sheets natives (création point, détail, filtres).

### 2. Évitement clavier dans une sheet (création de point = beaucoup d'inputs)
**Description.** Le formulaire `point/new.tsx` a date JJ/MM/AAAA, note, commentaire, sélecteur de partenaire. Dans une sheet à detent partiel, le clavier masque les champs. Sur Android, les bottom sheets ne se redimensionnent pas quand le clavier s'ouvre avec `fitToContents` (react-native-screens #3181) ; le comportement diffère d'iOS.
**Signes d'alerte.** Champ commentaire caché derrière le clavier, impossible de voir ce qu'on tape ; saut de layout à l'ouverture/fermeture du clavier.
**Prévention.**
- Sur sheet native : envelopper le contenu dans un scroll et gérer `KeyboardAvoidingView` / `useKeyboard` ; suivre la doc Expo « Keyboard handling ». Pour `@gorhom/bottom-sheet`, utiliser `BottomSheetTextInput` + `keyboardBehavior`/`keyboardBlurBehavior` (les `TextInput` standards ne déclenchent pas le bon redimensionnement).
- Tester ouverture clavier sur iOS **et** Android (divergence documentée).
**Zone du chantier.** Sheets natives (formulaire de point).

### 3. Conflits de gestes : pan de la sheet vs pan/scroll de la carte Mapbox
**Description.** Une bottom sheet par-dessus la carte crée une zone où deux reconnaisseurs de gestes se disputent le drag vertical : le pan de la sheet et le pan de la carte Mapbox (qui a ses propres gestes natifs). Avec `@gorhom/bottom-sheet`, le geste fonctionne sur iOS mais pas toujours pareil sur Android (issue #2434), et les `ScrollView` imbriqués nécessitent les composants scrollables dédiés de la lib (#1121).
**Signes d'alerte.** La carte pan derrière au lieu de la sheet (ou l'inverse) ; impossible de fermer la sheet en glissant ; scroll interne qui ferme la sheet au mauvais moment.
**Prévention.**
- Utiliser les composants scrollables fournis (`BottomSheetScrollView`/`BottomSheetFlatList`) — jamais un `ScrollView` brut dans la sheet.
- Sur la carte, désactiver les gestes Mapbox sous l'emprise de la sheet (ou rendre la sheet modale/opaque) pour éviter la compétition.
- Valider que tout l'arbre est sous `GestureHandlerRootView` (voir section Gestes, piège transverse).
**Zone du chantier.** Sheets + gestes carte (sheet de détail au-dessus de la map).

### 4. Navigation imbriquée : sheet dans le tab navigator
**Description.** Le projet a un tab navigator `(app)/_layout.tsx`. Présenter une route en `formSheet` depuis un onglet impose une route modale au bon niveau du `Stack` ; mal placée, la sheet s'affiche en plein écran push ou casse le retour. La doc Expo « Modals » précise la déclaration via `presentation`.
**Signes d'alerte.** La sheet pousse comme un écran plein au lieu de glisser depuis le bas ; le swipe-to-dismiss ne revient pas sur l'onglet d'origine.
**Prévention.** Déclarer la route modale dans le `Stack` parent approprié avec `options={{ presentation: 'formSheet', sheetAllowedDetents: [...] }}` ; ne pas imbriquer un tab dans la sheet. Vérifier le retour sur l'onglet courant après dismiss.
**Zone du chantier.** Sheets natives (intégration Expo Router).

---

## Reanimated/Gestures

Ces deux libs **ne sont pas dans `package.json`** aujourd'hui. Toute micro-interaction du redesign (sheets gorhom, animations de transition riches, gestes custom) les introduira. Ce sont des **modules natifs** → impose un **rebuild EAS** (jamais OTA seul) et une config worklets correcte sous Nouvelle Archi.

### 1. Reanimated v4 + worklets : config Babel et plugin déplacé
**Description.** Sous SDK 54, la version compatible est **Reanimated v4.1.x** (et non v3). v4 dépend de `react-native-worklets` et **ne supporte que la Nouvelle Architecture**. Le plugin Babel a migré : `react-native-reanimated/plugin` → `react-native-worklets/plugin` (issue reanimated #8231). Sous Expo, `babel-preset-expo` gère le plugin automatiquement → **ne pas** ajouter le plugin manuellement.
**Signes d'alerte.** Erreur au démarrage « Seems like you are using a Babel plugin `react-native-reanimated/plugin`. It was moved to `react-native-worklets` » ; ou échec de validation podspec « peer dependency `react-native-worklets` missing ».
**Prévention.**
- Installer via `npx expo install react-native-reanimated react-native-gesture-handler` (versions alignées SDK) ; installer **explicitement** `react-native-worklets` si la podspec le réclame.
- **Ne PAS toucher** `babel.config.js` pour y remettre un plugin Reanimated — laisser `babel-preset-expo` faire. Notre `babel.config.js` n'a que `module-resolver` : garder cet état et juste laisser le preset gérer les worklets.
- Si un ancien plugin Reanimated traîne quelque part → le retirer (cause de crash la plus fréquente).
**Zone du chantier.** Toute animation du redesign (transverse).

### 2. `GestureHandlerRootView` manquant → gestes ignorés / crash
**Description.** Sans envelopper l'app dans `<GestureHandlerRootView style={{flex:1}}>`, les gestes ne sont pas reconnus et on obtient « GestureDetector must be used as a descendant of GestureHandlerRootView ». gorhom et tout `GestureDetector` en dépendent. Le root layout actuel (`app/_layout.tsx`) ne wrappe probablement pas encore (gesture-handler absent).
**Signes d'alerte.** Au runtime : « PanGestureHandler must be used as a descendant of GestureHandlerRootView » ; ou gestes/sheets totalement inertes.
**Prévention.** Ajouter `GestureHandlerRootView` au **niveau racine** (`app/_layout.tsx`) au-dessus du `PaperProvider`/Stack. Une seule fois, au sommet.
**Zone du chantier.** Gestes + sheets (root layout).

### 3. Doublon de version de gesture-handler → crash natif
**Description.** Le crash « more than one instance of Gesture Handler » survient quand une dépendance embarque sa propre version dans son `node_modules` au lieu d'utiliser la peer dependency, provoquant deux modules JS pour un seul module natif (issue expo #39833 après upgrade SDK 52→54).
**Signes d'alerte.** « Failed to obtain view for PanGestureHandler » après ajout de gorhom ou upgrade ; crash uniquement en build natif (pas en dev parfois).
**Prévention.** Vérifier une seule version résolue (`npm ls react-native-gesture-handler`), dédupliquer, et toujours installer via `expo install` pour aligner sur la version SDK. Rebuild natif après ajout (pas d'OTA).
**Zone du chantier.** Gestes (toute introduction de la lib).

### 4. Worklets et accès au state Zustand / closures
**Description.** Les animations Reanimated tournent sur l'UI thread (worklets) ; accéder directement à du state JS (ex. store Zustand, thème `T`) depuis un worklet sans `runOnJS`/`useSharedValue` provoque crash ou valeurs figées. Pertinent vu le pattern `useTheme()`/`makeStyles(T)` du projet.
**Signes d'alerte.** Crash « Tried to synchronously call a non-worklet function on the UI thread » ; couleurs de thème figées dans une animation après toggle dark/light.
**Prévention.** Passer les valeurs de thème en `useSharedValue` mises à jour via `useEffect`, ou lire le thème côté JS et n'animer que des valeurs numériques (opacity/translate). Utiliser `runOnJS` pour rappeler du code JS (navigation, setState) depuis un geste.
**Zone du chantier.** Animations liées au thème (transverse redesign).

---

## Redesign-Wide Risks

### 1. `runtimeVersion` statique « 1.0.0 » → OTA poussée sur un binaire natif incompatible (CRITIQUE)
**Description.** `app.json` fixe `"runtimeVersion": "1.0.0"` en dur. Le workflow du projet pousse systématiquement un `eas update` après chaque modif. Or le redesign va **ajouter des modules natifs** (reanimated, gesture-handler, éventuellement gorhom, nouvelles icônes Mapbox). Un `eas update` sur la même runtime version « 1.0.0 » sera **livré OTA à un binaire TestFlight qui ne contient pas ces natifs** → crash au lancement chez les testeurs. C'est l'extension directe du constat connu « OTA ne s'applique pas pour l'utilisateur / il faut un build natif ».
**Signes d'alerte.** Après un `eas update`, l'app TestFlight existante crashe au démarrage ou sur l'écran utilisant le nouveau natif, alors qu'un build neuf marche.
**Prévention.**
- **Toute introduction de module natif = bump `runtimeVersion` + nouveau build EAS, puis seulement ensuite des OTA sur cette nouvelle runtime.** Ne jamais OTA du JS qui suppose un natif absent du binaire.
- Envisager de migrer vers `"runtimeVersion": { "policy": "fingerprint" }` pour que tout changement de natif force automatiquement une nouvelle runtime (au prix d'une policy marquée « expérimentale » — à évaluer).
- Pour les changements **purement JS/styles** (tokens couleur, copie, layout sans nouveau natif), l'OTA reste valable sur la runtime courante.
**Zone du chantier.** Transverse / livraison TestFlight.

### 2. Régressions de tokens de thème (dark/light)
**Description.** Le redesign touche la charte. Le projet impose le pattern `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T])` et interdit les couleurs/`fontFamily` hardcodées. Un refactor large réintroduit facilement des hex en dur ou casse un token dans un seul des deux thèmes.
**Signes d'alerte.** Texte invisible en light (texte clair sur fond clair) ; accent qui n'est plus `#ff2d87` ; un écran qui ne réagit plus au toggle IcoSun/IcoMoon.
**Prévention.** Pour chaque écran retouché : tester **les deux thèmes** ; grep des hex/`fontFamily` littéraux introduits ; vérifier que `makeStyles(T)` est bien recalculé via `useMemo([T])`. Aucun `backgroundColor` codé en dur (sauf l'exception documentée de la tab bar opaque `#111114`/`#f2f2f7`).
**Zone du chantier.** Refonte plein écran (tous les écrans).

### 3. Dynamic Type iOS qui casse les layouts éditoriaux
**Description.** La direction visuelle repose sur de gros titres serif (38–64px) et des eyebrows mono à `letterSpacing` serré. Avec Dynamic Type / réglages d'accessibilité iOS, RN met `allowFontScaling` à true par défaut → les titres explosent, les eyebrows passent à la ligne, les boutons pill débordent. RN ne bridge pas correctement `preferredFont`/`adjustsFontForContentSizeCategory` (issues RN #51612/#51915).
**Signes d'alerte.** En activant « Texte plus grand » dans Réglages iOS, titres tronqués/chevauchés, layout cassé, boutons qui débordent.
**Prévention.** Définir un `maxFontSizeMultiplier` global raisonnable (ex. 1.2–1.3, **pas** en dessous de 1.2 pour rester accessible) sur les composants de texte, en particulier les gros titres et eyebrows. Tester avec les tailles d'accessibilité iOS. Ne pas désactiver totalement le scaling (`allowFontScaling={false}` partout) — préférer le plafonner.
**Zone du chantier.** Refonte plein écran (typographie).

### 4. Régressions de safe-area
**Description.** Le projet impose `useSafeAreaInsets()` et **interdit** `SafeAreaView`. Une refonte qui réintroduit `SafeAreaView` ou oublie les insets casse le rendu sous le notch / la Dynamic Island / l'indicateur home, surtout avec la tab bar custom opaque et les nouvelles sheets.
**Signes d'alerte.** Header sous l'encoche, contenu masqué par l'indicateur home, double padding en haut, tab bar qui mord sur la zone gesture.
**Prévention.** N'utiliser que `useSafeAreaInsets()` (jamais `SafeAreaView`, conformément à la règle projet). Vérifier le wrapping `SafeAreaProvider` au root. Tester sur device à notch + Dynamic Island.
**Zone du chantier.** Refonte plein écran (layout global, tab bar, sheets).

### 5. Régressions de performance dues aux animations
**Description.** Empiler animations Reanimated, BlurView (`expo-blur`) et clustering Mapbox peut faire chuter le framerate, surtout sur la carte qui re-render à chaque pan. `expo-blur` est notoirement coûteux sur iOS quand il est animé ou multiplié.
**Signes d'alerte.** Pan de carte saccadé, ouverture de sheet à faible FPS, jank pendant les transitions, chauffe device.
**Prévention.**
- N'animer que des propriétés compositor-friendly (`transform`, `opacity`) — éviter d'animer width/height/margins.
- Limiter `BlurView` aux surfaces statiques ; rappel règle projet : **pas de BlurView sur la tab bar** (fond opaque imposé). Ne pas l'animer.
- Mémoïser les données GeoJSON passées au `ShapeSource` (éviter de recréer la FeatureCollection à chaque render).
- Profiler avec le moniteur de perf RN sur device avant/après.
**Zone du chantier.** Carte + sheets + transitions (transverse).

### 6. Changements natifs non rejouables en OTA (pièges TestFlight au-delà du runtimeVersion)
**Description.** Au-delà du `runtimeVersion`, certains changements de config (`app.json` plugins, permissions Info.plist, ajout du plugin Mapbox d'assets, `GestureHandlerRootView`) sont des changements natifs nécessitant rebuild. Rappel : le token `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (secret EAS) doit exister avant tout `eas build` touchant Mapbox.
**Signes d'alerte.** Build EAS qui échoue sur le pod Mapbox (token manquant) ; feature native qui « marche en dev client » mais crashe en build TestFlight.
**Prévention.** Checklist avant build : secret `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` présent (`eas env:list`), `runtimeVersion` bumpé si natif modifié, tester sur **dev client buildé** (pas Expo Go) avant de soumettre à TestFlight.
**Zone du chantier.** Livraison TestFlight (transverse).

---

## Prevention Summary

| Pitfall | Signes d'alerte | Prévention | Zone |
|---------|-----------------|------------|------|
| `ShapeSource.onPress` peu fiable iOS / mauvais hit | Tap pin sans effet sur device iOS ; tap dans le vide ouvre un point | `onPress` sur la source, lire `features`/`cluster`, propriétés sérialisables, tester sur device iOS | Clustering |
| `getClusterExpansionZoom` lève sur iOS | Exception au tap d'un cluster, pas d'expansion | `try/catch` + fallback zoom relatif, tester feature vs clusterId | Clustering |
| `clusterProperties` non transmis (Android) | Badge/couleur cluster figé ou vide | S'appuyer sur `point_count` natif ; agrégation custom via supercluster JS | Clustering |
| Perte du look custom des marqueurs | Pins redeviennent cercles génériques, charte perdue | Icônes PNG/`Images` aux tokens ; hybride `PointAnnotation` pour le point sélectionné uniquement | Clustering / charte |
| Clusters invisibles au 1er rendu | Pins absents jusqu'au pan/reload | Déclarer `Images` avant `SymbolLayer`, attendre `onDidFinishLoadingStyle`, valider sur device | Clustering |
| `formSheet` trop petit iOS 26 / RN-screens 4.16.0 | Sheet rabougrie sur device iOS 26, padding incohérent | Detent ≥ 0.7 ou plein écran, épingler RN-screens patché, repli gorhom, tester device iOS 26 | Sheets natives |
| Clavier masque les inputs en sheet | Champ commentaire caché, saut layout Android | `BottomSheetTextInput`/`KeyboardAvoidingView`, scroll interne, tester iOS+Android | Sheets natives |
| Conflit gestes sheet vs pan carte | Carte pan au lieu de la sheet, dismiss impossible | Composants scrollables dédiés, désactiver gestes Mapbox sous la sheet, `GestureHandlerRootView` | Sheets + gestes |
| Sheet mal imbriquée dans le tab nav | Sheet pousse en plein écran, retour cassé | Route modale `presentation:'formSheet'` au bon niveau du Stack | Sheets natives |
| Reanimated v4 / plugin worklets déplacé | Erreur Babel plugin déplacé, podspec worklets manquant | `expo install`, ne pas éditer babel.config.js, installer `react-native-worklets` si requis | Gestes (transverse) |
| `GestureHandlerRootView` manquant | « must be descendant of GestureHandlerRootView », gestes inertes | Wrapper racine unique dans `app/_layout.tsx` | Gestes + sheets |
| Doublon version gesture-handler | « Failed to obtain view », crash build natif | `npm ls`, dédupliquer, `expo install`, rebuild natif | Gestes |
| Worklet accède au state JS/thème | Crash « non-worklet on UI thread », thème figé | `useSharedValue`/`runOnJS`, animer des valeurs numériques | Animations thème |
| **runtimeVersion statique → OTA sur natif absent (CRITIQUE)** | App TestFlight crashe après `eas update`, build neuf OK | Bump runtimeVersion + rebuild à chaque ajout natif ; envisager policy `fingerprint` ; OTA réservé au JS pur | Livraison TestFlight |
| Régression tokens thème dark/light | Texte invisible en light, accent perdu, toggle inerte | Tester les 2 thèmes, grep hex/fontFamily en dur, `makeStyles(T)` mémoïsé | Refonte plein écran |
| Dynamic Type casse les gros titres | Titres tronqués/chevauchés en texte agrandi iOS | `maxFontSizeMultiplier` ~1.2–1.3 sur titres/eyebrows, tester tailles a11y | Refonte (typo) |
| Régression safe-area | Header sous l'encoche, contenu sous l'indicateur home | `useSafeAreaInsets()` only (jamais `SafeAreaView`), `SafeAreaProvider` au root | Refonte (layout) |
| Perte de FPS (animations + blur + clustering) | Pan carte saccadé, sheet à bas FPS, jank | Animer transform/opacity, pas de BlurView animé/tab bar, mémoïser GeoJSON, profiler device | Transverse |
| Changements natifs non-OTA (plugins/permissions/Mapbox token) | Build EAS échoue sur pod Mapbox, feature crashe en TestFlight | Vérifier secret `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`, rebuild si natif modifié, tester dev client buildé | Livraison TestFlight |

---

### Sources
- [rnmapbox/maps #1746 — ShapeSource onPress iOS](https://github.com/rnmapbox/maps/issues/1746)
- [rnmapbox/maps #2913 — onPress hors géométrie](https://github.com/rnmapbox/maps/issues/2913)
- [rnmapbox/maps #2001 — getClusterExpansionZoom iOS](https://github.com/rnmapbox/maps/issues/2001)
- [rnmapbox/maps #3902 — clusterProperties Android](https://github.com/rnmapbox/maps/issues/3902)
- [rnmapbox/maps #3549 — clusters invisibles simulateur iOS](https://github.com/rnmapbox/maps/discussions/3549)
- [rnmapbox docs — ShapeSource](https://rnmapbox.github.io/docs/components/ShapeSource) / [PointAnnotation](https://github.com/rnmapbox/maps/blob/main/docs/PointAnnotation.md) / [MarkerView](https://rnmapbox.github.io/docs/components/MarkerView)
- [react-native-screens #3235 — iOS 26 form sheet trop petit](https://github.com/software-mansion/react-native-screens/issues/3235)
- [react-native-screens #3181 — sheet ne resize pas au clavier (Android)](https://github.com/software-mansion/react-native-screens/issues/3181)
- [expo/expo #35616 — formSheet mauvaise taille iOS](https://github.com/expo/expo/issues/35616)
- [expo/expo #42904 — padding incohérent fitToContents](https://github.com/expo/expo/issues/42904)
- [Expo docs — Modals](https://docs.expo.dev/router/advanced/modals/) / [Keyboard handling](https://docs.expo.dev/guides/keyboard-handling/)
- [gorhom/bottom-sheet — Troubleshooting](https://gorhom.dev/react-native-bottom-sheet/troubleshooting) / [#1121](https://github.com/gorhom/react-native-bottom-sheet/issues/1121) / [#1389](https://github.com/gorhom/react-native-bottom-sheet/issues/1389) / [#2434](https://github.com/gorhom/react-native-bottom-sheet/issues/2434)
- [reanimated #8231 — plugin déplacé vers worklets](https://github.com/software-mansion/react-native-reanimated/issues/8231)
- [Expo docs — Reanimated](https://docs.expo.dev/versions/latest/sdk/reanimated/) / [Gesture Handler](https://docs.expo.dev/versions/latest/sdk/gesture-handler/)
- [expo/expo #39833 — gesture-handler après upgrade SDK 54](https://github.com/expo/expo/issues/39833)
- [gesture-handler — Troubleshooting](https://docs.swmansion.com/react-native-gesture-handler/docs/guides/troubleshooting/)
- [facebook/react-native #51612](https://github.com/facebook/react-native/issues/51612) / [#51915 — Dynamic Type non supporté](https://github.com/facebook/react-native/issues/51915)
- [RN docs — Text (allowFontScaling/maxFontSizeMultiplier)](https://reactnative.dev/docs/text)
- [Expo docs — Updates](https://docs.expo.dev/versions/latest/sdk/updates/) / [Runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)

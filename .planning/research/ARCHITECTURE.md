# iOS Patterns & Architecture Research

> Recherche menée pour LoveMap (Expo SDK 54, RN 0.81.5, New Architecture activée).
> Objectif : adopter des **patterns d'interaction iOS natifs** tout en conservant le design éditorial noir/rose (Cormorant italic + Inter Tight, angles francs `T.cardRadius = 4`).
> Date : 2026-05-29. Stack vérifiée dans `package.json`.

## Contexte du projet (état réel vérifié)

Dépendances actuellement installées (extrait `package.json`) :

| Paquet | Version installée | Pertinent pour |
|--------|-------------------|----------------|
| `expo` | `~54.0.0` | Base |
| `expo-router` | `~6.0.23` | Navigation, sheets natifs |
| `react-native` | `0.81.5` | New Architecture |
| `react-native-screens` | `~4.16.0` | Stack natif, form sheets, gestures |
| `react-native-safe-area-context` | `~5.6.0` | Safe areas |
| `expo-haptics` | `~15.0.8` | Retour haptique |
| `expo-blur` | `~15.0.8` | Tab bar (note : règle projet n°13 interdit le BlurView sur la tab bar) |
| `react-native-paper` | `^5.12.3` | UI minimale |

**Absents (important)** : `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`.
Conséquence directe : la voie « sheets natifs via `expo-router` » ne demande **aucune nouvelle dépendance** ; la voie `@gorhom/bottom-sheet` exige d'ajouter reanimated + gesture-handler (+ risques de compat SDK 54, voir plus bas).

---

## Bottom Sheets

### Les trois options comparées

| Critère | `expo-router` form sheet natif (via `react-native-screens`) | `@gorhom/bottom-sheet` v5 | `react-native-bottom-sheet` (générique) |
|---------|------------------------------------------------------------|----------------------------|------------------------------------------|
| Rendu | **Vrai `UISheetPresentationController` iOS** (natif) | Vue JS recréée (Reanimated) | idem, non maintenu/ambigu |
| Detents medium/large | Oui, `sheetAllowedDetents` | Oui, `snapPoints` | Oui |
| Grab handle natif | Oui, `sheetGrabberVisible` (iOS) | Simulé en JS | Simulé |
| Swipe-to-dismiss | Natif iOS | JS (gesture-handler) | JS |
| Dépendances nouvelles | **Aucune** (déjà dans le projet) | reanimated v3/v4 + gesture-handler v2 | idem |
| Compat SDK 54 | Native, supportée | **Bugs signalés** (crash à la fermeture, sheet qui n'ouvre plus après upgrade reanimated v4 / Expo 54) | Non recommandé |
| Intégration routing | S'intègre comme une route Expo Router (URL, deep link, back) | Composant local, hors routing | Hors routing |
| Personnalisation visuelle fine (fond, contenu éditorial) | Bonne, mais le chrome (handle, coins) est natif iOS | **Totale** (tout est en JS) | Totale |

### Recommandation : form sheet natif `expo-router` par défaut

Pour LoveMap, **le form sheet natif d'Expo Router est le bon choix par défaut** : zéro dépendance ajoutée, vrai feeling iOS (detents, grabber, swipe), et il s'intègre au routing existant (`app/(app)/...`). Les écrans candidats : `point/new`, `point/[id]` (consentement), `FiltersBottomSheet`, `FriendSelector`.

> Note de cohérence avec le design : le chrome (poignée, coins arrondis) est du natif iOS. L'esthétique « angles francs » ne s'applique **pas** au conteneur du sheet (impossible de forcer `cornerRadius: 4` proprement sans casser le rendu natif iOS 26). On garde les coins natifs pour le conteneur et on applique l'identité éditoriale **à l'intérieur** (typo, couleurs, eyebrows). C'est exactement l'esprit « hybride » demandé.

#### Config concrète — déclaration de l'écran sheet

Dans un `_layout.tsx` de Stack (par ex. `app/(app)/_layout.tsx` ou un layout dédié) :

```tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />

      {/* Sheet "filtres" : medium + large, grabber visible */}
      <Stack.Screen
        name="point/filters"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1],     // medium puis large
          sheetInitialDetentIndex: 0,
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,             // valeur native iOS; 4 casserait le rendu
          sheetLargestUndimmedDetentIndex: 0, // le fond reste interactif au detent medium
          headerShown: false,
        }}
      />

      {/* Sheet "détail / consentement" : plein écran draggable */}
      <Stack.Screen
        name="point/[id]"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.9, 1],
          sheetGrabberVisible: true,
          sheetCornerRadius: 24,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
```

#### Options disponibles (vérifiées sur la doc Expo officielle)

| Option | Type | Notes |
|--------|------|-------|
| `presentation` | `'formSheet'` (+ `'modal'`, `'transparentModal'`, `'containedModal'`, `'fullScreenModal'`, `'card'`) | `formSheet` = bottom sheet à detents |
| `sheetAllowedDetents` | `number[]` (0–1, ordre croissant) ou `'fitToContents'` | **Android ≤ 3 detents** ; iOS illimité |
| `sheetInitialDetentIndex` | `number \| 'last'` (défaut `0`) | Detent à l'ouverture |
| `sheetGrabberVisible` | `boolean` | **iOS uniquement** |
| `sheetCornerRadius` | `number` (px) | Rayon natif du conteneur |
| `sheetLargestUndimmedDetentIndex` | `number \| 'none' \| 'last'` | Jusqu'à quel detent le fond reste non-grisé/interactif |
| `unstable_sheetFooter` | composant React | Footer Android (expérimental) |

**Confiance : High** pour l'existence et la signature des options (doc Expo officielle). **Confiance : Medium** sur le comportement exact iOS 26 : des issues ouvertes signalent que `sheetAllowedDetents: 'fitToContents'` rend mal (sheet qui s'étend en plein écran avec `headerShown`, padding incohérent, rendu trop petit sur iOS 26). **Recommandation : utiliser des detents numériques explicites (`[0.5, 1]`), pas `'fitToContents'`, jusqu'à stabilisation.**

#### Quand préférer `@gorhom/bottom-sheet`

Uniquement si on a besoin d'un sheet **persistant non-modal** (qui reste affiché par-dessus la carte sans bloquer l'interaction), d'un sheet avec liste scrollable + pull-to-refresh interne très custom, ou d'un contrôle pixel-perfect du chrome. Dans ce cas : `npx expo install @gorhom/bottom-sheet react-native-reanimated react-native-gesture-handler`, wrap dans `GestureHandlerRootView`. **À tester immédiatement sur SDK 54** vu les bugs reanimated v4 signalés (crash fermeture / sheet qui n'ouvre plus). **Confiance : Medium** (compat SDK 54 instable au moment de la recherche).

---

## Gestures & Transitions

### Setup idiomatique 2026

Expo Router est bâti sur React Navigation + `react-native-screens`. Avec le **native stack** (ce qu'utilise Expo Router par défaut), les transitions et le **swipe-back (interactive pop gesture)** sont **fournis nativement par UIKit** — pas besoin de gesture-handler/reanimated pour ça.

**Sur iOS, `gestureEnabled: true` est le défaut** → le swipe-back interactif fonctionne déjà sans configuration. Pour LoveMap qui utilise `TouchableOpacity` + `Modal` custom, **migrer les modals custom vers des routes Stack/form sheets fait gagner gratuitement le swipe-to-dismiss natif**.

#### Options de gestes/animations (native stack, vérifiées doc Expo)

```tsx
<Stack
  screenOptions={{
    animation: 'slide_from_right', // défaut iOS card
    animationDuration: 350,         // iOS, défaut 350ms
    gestureEnabled: true,           // swipe-back interactif (défaut iOS)
    gestureDirection: 'horizontal',
    fullScreenGestureEnabled: false, // true = swipe depuis tout l'écran (anim simple_push)
  }}
>
  {/* ... */}
</Stack>
```

| Option | Valeurs / effet |
|--------|-----------------|
| `gestureEnabled` | `boolean` — défaut `true` (iOS). Swipe-back interactif |
| `fullScreenGestureEnabled` | `boolean` — swipe depuis n'importe où (pas juste le bord). Donne l'anim `simple_push` |
| `gestureDirection` | `'horizontal'` \| `'vertical'`. `vertical` force `fullScreenGestureEnabled: true` + `animation: 'slide_from_bottom'` |
| `fullScreenGestureShadowEnabled` | `boolean` (défaut `true`) — ombre pendant le geste |
| `animation` | `default`, `fade`, `fade_from_bottom`, `flip`, `simple_push`, `slide_from_bottom`, `slide_from_right`, `slide_from_left`, `none` |
| `animationDuration` | ms (iOS), défaut `350` |
| `animationMatchesGesture` | iOS — l'anim de dismiss suit `animation` |

**Confiance : High** (doc Expo + React Navigation native stack).

> ⚠️ Bug 2025/2026 signalé : sur iOS, le swipe-back peut provoquer un **flash de couleur de fond / jitter** si la couleur de fond du thème n'est pas appliquée au conteneur de transition. **Mitigation LoveMap** : définir explicitement `contentStyle: { backgroundColor: T.bg }` dans `screenOptions` du Stack pour que le fond noir/blanc soit posé sur le conteneur natif. **Confiance : Medium** (issue ouverte, contournement non garanti).

### Gestes custom (au-delà du swipe-back)

Pour des gestes **personnalisés** (drag d'un pin, long-press sur la carte, swipe sur une carte de moment), il faut **`react-native-gesture-handler` + `react-native-reanimated`** (combo idiomatique 2026). Ce n'est **pas installé** actuellement.

Setup New Architecture (RN 0.81 / SDK 54) :

```bash
npx expo install react-native-gesture-handler react-native-reanimated
```

1. Wrapper la racine (`app/_layout.tsx`) :

```tsx
import 'react-native-gesture-handler'; // doit être tout en haut de l'entrée si entry custom
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* PaperProvider + Stack ... */}
    </GestureHandlerRootView>
  );
}
```

2. Reanimated v4 (par défaut sur SDK 54) **requiert la New Architecture** (déjà active ici) et le plugin Babel. Avec SDK 54, `react-native-worklets` est le moteur des worklets pour Reanimated v4 — vérifier que `babel.config.js` contient le plugin worklets/reanimated en **dernier**.

**Confiance : High** sur le besoin du combo et le wrap `GestureHandlerRootView`. **Confiance : Medium** sur les détails Babel/worklets exacts (à vérifier contre le template Expo SDK 54 au moment de l'install — Reanimated v4 a changé le pipeline worklets).

> Recommandation : **ne pas installer reanimated/gesture-handler tant qu'un geste custom réel n'est pas requis** (YAGNI). Le swipe-back et les sheets natifs couvrent 90 % du besoin « feeling iOS » sans alourdir le bundle ni risquer les bugs reanimated v4 + SDK 54.

---

## Haptics

`expo-haptics ~15.0.8` est déjà installé. Trois familles d'API.

### Mapping action UI → haptique (prescriptif)

| Événement UI LoveMap | API | Style |
|----------------------|-----|-------|
| Changement de sélection (toggle pins/heatmap, choix d'un detent, sélection d'un ami dans `FriendSelector`, segmented control) | `Haptics.selectionAsync()` | — |
| Appui sur bouton secondaire / tap léger (PressableScale, sélection d'item de liste) | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | Light |
| Action principale confirmée non destructive (ouvrir un sheet, FAB création de point) | `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` | Medium |
| Action lourde / engageante (drop d'un pin sur la carte, début de drag) | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` | Heavy |
| Succès (« Page scellée » — point créé, ami accepté, consentement validé) | `Haptics.notificationAsync(NotificationFeedbackType.Success)` | Success |
| Avertissement (validation formulaire échouée, partenaire manquant) | `Haptics.notificationAsync(NotificationFeedbackType.Warning)` | Warning |
| Erreur (échec réseau, RPC `create_point` en erreur, « Page effacée » action destructive irréversible) | `Haptics.notificationAsync(NotificationFeedbackType.Error)` | Error |

### Bonnes pratiques

- **Ne pas `await`** pour le feedback immédiat (évite la latence perçue) :
  ```ts
  import * as Haptics from 'expo-haptics';
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // fire-and-forget
  ```
- **Cohérence** : la même action déclenche toujours le même haptique (ex. tout succès = `Success`). Idéal : centraliser dans un helper `lib/haptics.ts` exportant `haptics.select()`, `haptics.tap()`, `haptics.success()`, etc. → évite la divergence (DRY).
- **Parcimonie** : pas de haptique sur le scroll ni sur chaque re-render. Réserver aux moments « éditoriaux » (sceller/effacer une page).
- **iOS principalement** : le retour est riche sur iOS ; Android est plus limité. Tester sur device réel (simulateur ne reproduit pas).
- Respecter les réglages système d'accessibilité (l'OS coupe déjà les haptiques si l'utilisateur les désactive — ne pas réimplémenter).

Helper suggéré :

```ts
// lib/haptics.ts
import * as Haptics from 'expo-haptics';

export const haptics = {
  select: () => Haptics.selectionAsync(),
  tap:     () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  press:   () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  drop:    () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error:   () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};
```

**Confiance : High** (doc Expo officielle + pratiques établies).

---

## Safe Areas & Dynamic Type

### Safe areas — `react-native-safe-area-context ~5.6.0`

La règle projet existante (« `useSafeAreaInsets()` — jamais `SafeAreaView` ») est **correcte et idiomatique**. Précisions :

- **`SafeAreaProvider`** doit envelopper la racine. Avec Expo Router c'est **déjà injecté automatiquement** par le `_layout.tsx` racine — ne pas le doubler.
- **`useSafeAreaInsets()`** donne `{ top, bottom, left, right }`. Pattern LoveMap :
  ```tsx
  const insets = useSafeAreaInsets();
  // header
  <View style={{ paddingTop: insets.top }} />
  // bas d'écran / au-dessus du home indicator
  <View style={{ paddingBottom: insets.bottom }} />
  ```
- **Home indicator** : toujours réserver `insets.bottom` sur les barres/CTA collés en bas (FAB, boutons « Sceller la page »). Ne jamais coller à `bottom: 0` brut.
- **Tab bar** : la tab bar custom doit ajouter `insets.bottom` à sa hauteur (cohérent avec la règle projet n°13 « fond opaque »).
- **Scroll iOS** : pour les `ScrollView`/`FlatList` plein écran, `contentInsetAdjustmentBehavior="automatic"` applique automatiquement les insets haut/bas (évite le contenu masqué). Préférer ça à un padding manuel quand la liste occupe tout l'écran (ex. `point/list`).
- **Perf** : `useSafeAreaInsets()` peut provoquer un léger flicker au 1er render (JS applique les insets après le layout) et re-render quand les insets changent (rotation). Acceptable pour une app portrait. Ne pas sur-imbriquer.
- **iOS vs Android** : iOS rapporte des insets fiables sur tous les bords ; Android varie selon le constructeur — tester sur device.

**Confiance : High.**

### Dynamic Type / `allowFontScaling`

iOS « Dynamic Type » = réglage utilisateur (Réglages → Accessibilité → Affichage et taille du texte → Texte plus grand). En RN, le mapping se fait via les props `Text` :

- **`allowFontScaling`** (défaut `true`) : laisser le texte suivre le réglage système. **Le désactiver globalement est un anti-pattern d'accessibilité** — à proscrire.
- **`maxFontSizeMultiplier`** : meilleure approche que désactiver. Borne l'agrandissement sans casser l'accessibilité. Recommandation :
  - **Corps de texte / commentaires (Cormorant) : laisser scaler généreusement** (`maxFontSizeMultiplier` ≈ `1.6`–`2.0` ou non borné).
  - **Titres très grands (38–64px serif) et eyebrows mono : borner** (`maxFontSizeMultiplier` ≈ `1.2`–`1.3`) pour préserver la mise en page éditoriale (sinon les gros titres explosent le layout).
  - **Ne jamais descendre sous `1.2`** (impact accessibilité fort).

Exemple, à intégrer idéalement dans un composant `AppText` réutilisable (DRY, vu que `defaultProps` est déprécié en RN — plus de réglage global facile) :

```tsx
// components/ui/AppText.tsx
import { Text, TextProps } from 'react-native';

type Variant = 'body' | 'title' | 'eyebrow';
const MAX_SCALE: Record<Variant, number> = {
  body: 2.0,      // accessibilité : scaling large
  title: 1.3,     // protège la mise en page éditoriale
  eyebrow: 1.2,
};

export function AppText({ variant = 'body', ...props }: TextProps & { variant?: Variant }) {
  return <Text allowFontScaling maxFontSizeMultiplier={MAX_SCALE[variant]} {...props} />;
}
```

- **Layout** : utiliser flexbox + padding/margin, **éviter les `height`/`width` fixes sur les conteneurs de texte** susceptibles de grandir, sinon le texte est tronqué quand l'utilisateur agrandit la police.
- **Limite RN connue** : RN ne bridge pas pleinement `UIFont.preferredFont(forTextStyle:)` / `adjustsFontForContentSizeCategory`. On reste sur `allowFontScaling` + `maxFontSizeMultiplier`, ce qui est suffisant et idiomatique.

**Confiance : High** sur les props et la stratégie. **Confiance : Medium** sur les multiplicateurs exacts (à ajuster visuellement avec les polices Cormorant/Inter Tight sur device).

---

## Recommandations (avec confiance)

1. **Bottom sheets → form sheet natif `expo-router` par défaut.** Zéro dépendance ajoutée, vrai sheet iOS (detents, grabber, swipe-dismiss), intégré au routing. Migrer `point/new`, `point/[id]`, `FiltersBottomSheet`, `FriendSelector` de `Modal` custom vers des routes `presentation: 'formSheet'` avec `sheetAllowedDetents: [0.5, 1]` (detents **numériques**, pas `'fitToContents'`), `sheetGrabberVisible: true`. Garder le chrome natif iOS pour le conteneur, l'identité éditoriale **à l'intérieur**. **Confiance : High** (signatures), **Medium** (rendu iOS 26 fin → tester).

2. **Gestes/transitions → s'appuyer sur le native stack, ne rien ajouter pour l'instant.** Le swipe-back interactif est déjà natif et activé par défaut (`gestureEnabled: true`). Migrer les `Modal` custom vers des routes Stack pour récupérer gratuitement le swipe-to-dismiss. Poser `contentStyle: { backgroundColor: T.bg }` pour éviter le flash de fond au swipe-back. **N'installer `react-native-gesture-handler` + `react-native-reanimated` que si un geste custom réel apparaît** (drag de pin, swipe d'item) — attention aux bugs reanimated v4 + SDK 54. **Confiance : High** (native stack), **Medium** (mitigation flash, compat reanimated v4).

3. **Haptics & accessibilité → centraliser + borner.** Créer `lib/haptics.ts` (mapping cohérent select/tap/press/drop/success/warning/error, fire-and-forget) et `components/ui/AppText.tsx` (`allowFontScaling` toujours `true`, `maxFontSizeMultiplier` borné par variant : corps ~2.0, titres ~1.3). Toujours réserver `insets.bottom` au-dessus du home indicator sur FAB/CTA, `contentInsetAdjustmentBehavior="automatic"` sur les listes plein écran. **Confiance : High.**

### Ce que je n'ai pas pu vérifier (flags)

- **Rendu exact des form sheets sur iOS 26** : issues ouvertes (`fitToContents` qui s'étend en plein écran, padding incohérent, sheet trop petit). À valider sur device/TestFlight avant de généraliser. **Low/Medium.**
- **Pipeline Babel/worklets de Reanimated v4 sur SDK 54** : v4 a changé le moteur de worklets (`react-native-worklets`). Config Babel exacte à confirmer contre le template Expo SDK 54 si l'install est faite. **Medium.**
- **Compat `@gorhom/bottom-sheet` v5 + reanimated v4 + SDK 54** : crashs signalés (fermeture, ouverture). Non recommandé tant que non confirmé stable. **Medium.**
- **Multiplicateurs Dynamic Type idéaux** pour Cormorant/Inter Tight aux grandes tailles : à calibrer visuellement. **Medium.**

---

## Sources

- [Modals — Expo Documentation](https://docs.expo.dev/router/advanced/modals/)
- [Stack — Expo Documentation](https://docs.expo.dev/router/advanced/stack/)
- [react-native-screens — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/screens/)
- [Introducing React Native Screens 4.0.0 — Software Mansion](https://blog.swmansion.com/introducing-react-native-screens-4-0-0-1b833ff98a55)
- [Expo SDK 54 — Changelog](https://expo.dev/changelog/sdk-54)
- [Issue #42066 — FormSheet expands to full screen with fitToContents](https://github.com/expo/expo/issues/42066)
- [Issue #42904 — fitToContents inconsistent top padding](https://github.com/expo/expo/issues/42904)
- [Issue #3235 — Form sheet renders too small on iOS 26 (react-native-screens)](https://github.com/software-mansion/react-native-screens/issues/3235)
- [Issue #42545 — iOS swipe back gesture rendering artifacts (Expo Router)](https://github.com/expo/expo/issues/42545)
- [Haptics — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [react-native-gesture-handler — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/gesture-handler/)
- [Bottom Sheet (@gorhom) — Documentation](https://gorhom.dev/react-native-bottom-sheet/)
- [Issue #2528 — Bottom sheet won't open after upgrading to reanimated v4/expo 54](https://github.com/gorhom/react-native-bottom-sheet/issues/2528)
- [react-native-safe-area-context — Expo Documentation](https://docs.expo.dev/versions/latest/sdk/safe-area-context/)
- [Supporting safe areas — React Navigation](https://reactnavigation.org/docs/handling-safe-area/)
- [Text — React Native (allowFontScaling, maxFontSizeMultiplier)](https://reactnative.dev/docs/text)
- [Dealing With Accessibility Font Sizes in React Native — Ignite Cookbook](https://ignitecookbook.com/docs/recipes/AccessibilityFontSizes/)

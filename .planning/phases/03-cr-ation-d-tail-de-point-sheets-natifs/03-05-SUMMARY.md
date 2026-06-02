# 03-05 — SUMMARY (Gate device + correctifs sheet)

**Statut :** ✅ Terminé — validé device sur build **#26** (TestFlight, iOS 26).
**Requirements couverts :** IOS-01, IOS-02, UI-03, UI-04 (les 4 → Phase 3 complète 5/5).

## Objet

Plan de validation device de la Phase 3. La validation a révélé un bug bloquant
(contenu « noir en haut » des sheets) qui a nécessité un cycle de correctifs
builds **#20 → #26** avant de passer.

## Cause racine (identifiée build #25→#26)

`presentation: 'formSheet'` (détents custom de react-native-screens) est **cassé
sur iOS 26 + react-native-screens 4.16** :
- Issue [#3235](https://github.com/software-mansion/react-native-screens/issues/3235)
  (« the sheet … is anchored to the bottom of the screen ») + [#2522](https://github.com/software-mansion/react-native-screens/issues/2522)
  (contenu `flex:1` mesuré comme zéro).
- Le contenu est **ancré en bas** du sheet → grand vide noir en haut. Au clavier,
  le contenu passe sous le clavier → entièrement noir.
- **Non corrigé** jusqu'à 4.20+ (les fixes form sheet récents sont Android-only) et
  **non corrigeable en layout JS** (une taille explicite `useWindowDimensions`,
  workaround #2522, a au contraire poussé le contenu hors écran → sheet 100% noir #25).

## Correctif retenu (#26)

`app/(app)/_layout.tsx` : `presentation: 'formSheet'` → **`presentation: 'modal'`**
(carte pageSheet native iOS : glisse du bas, `gestureEnabled` swipe-to-dismiss,
`headerShown:false`). Rend le contenu correctement de haut en bas. Détents custom,
poignée et `sheetCornerRadius` supprimés (non applicables au modal). `usePreventRemove`
(garde D-04 « Abandonner ce moment ? ») fonctionne toujours sur le dismiss du modal.

## Correctifs secondaires (builds #20→#24, conservés)

1. **Aperçu carte retiré des sheets** : un `MapboxGL.MapView` (GL) **et** un
   `<Image>` Mapbox Static rendent noir dans le contexte sheet → remplacés par
   un **cartouche de lieu** (pin rose + adresse/coords) en création et l'**adresse
   en métadonnées** en détail. `mapboxStaticUrl()` conservé dans `constants/config.ts`
   pour une éventuelle réintroduction (présentation modal désormais fiable).
2. **Layout clavier** : suppression du `KeyboardAvoidingView` (conflit avec la gestion
   native du sheet) → `ScrollView` avec `contentInsetAdjustmentBehavior="never"`
   + `automaticallyAdjustKeyboardInsets`.

## Vérifications

- `tsc --noEmit` : **36 erreurs** (baseline préexistante), **0 nouvelle** sur tous les builds.
- Build EAS natif #26 OK + auto-submit TestFlight OK.
- **Device (utilisateur, « Validé ») :** détail et création s'ouvrent en carte du bas,
  contenu visible immédiatement (zéro noir), clavier ne masque rien, swipe-to-dismiss
  + confirmation OK.

## Dette / suites

- **Aperçu carte** : à réintroduire éventuellement dans le détail/création (build dédié)
  maintenant que la présentation est un `modal` fiable — à tester.
- **CLAUDE.md** : règle 19 ajoutée (formSheet iOS 26 cassé → modal) ; tableau des phases
  + archi navigation mis à jour.

## Commits

- `formSheet → modal` (cause racine #26) + reverts taille-explicite.
- Correctifs intermédiaires #21–#25 (overlay statique, layout, taille explicite).

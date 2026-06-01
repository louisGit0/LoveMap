---
phase: 01-stabilisation-fondations
plan: 04
status: complete
requirements: [FOND-01, FOND-02]
---

# Summary 01-04 — Socle natif + build #17

## Objective atteint

Socle natif de la refonte posé et validé sur device via le build TestFlight #17.

## Ce qui a été construit

### Task 1 — installation + câblage (autonome)
- `npx expo install react-native-reanimated` (4.1.7, v4 New Architecture) + `react-native-gesture-handler` (2.28.0, version unique dédupliquée).
- Peer `react-native-worklets` (0.5.1) installé explicitement (requis par reanimated v4).
- `app/_layout.tsx` : `GestureHandlerRootView style={{ flex: 1 }}` enveloppe le return principal (au-dessus de PaperProvider) ; return anticipé `!fontsLoaded` non enveloppé.
- `app.json` : `runtimeVersion: { "policy": "fingerprint" }` (FOND-01 / D-10), édition mono-clé.
- `babel.config.js` NON modifié (plugin worklets géré par babel-preset-expo, D-09).
- Smoke test jetable `components/dev/ReanimatedSmokeTest.tsx` (badge `RNA v4` animé via worklet, gardé `__DEV__`).

### Task 2 — build #17 + vérification device (checkpoint humain)
- Pré-checks : EAS auth OK (`expomannnnn`), secret `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` présent (pod Mapbox OK), profil production (autoIncrement → build 17).
- `eas build --platform ios --profile production --auto-submit` → **build #17 réussi** (App v1.0.0, build 17, IPA produit).
- Soumission TestFlight : 1er auto-submit en échec transitoire (serveurs Apple), **retry `eas submit` réussi** → binaire en traitement App Store Connect.
- **Validation device utilisateur : « Ok »** — l'app démarre sans crash GestureHandlerRootView ni erreur worklets ; le badge `RNA v4` pulse (worklets reanimated v4 fonctionnels) ; aucun gesture mort (navigation tabs + scroll listes OK).

### Task 3 — retrait du smoke test (autonome)
- `components/dev/ReanimatedSmokeTest.tsx` supprimé ; import + montage `__DEV__` retirés de `app/_layout.tsx`.
- `GestureHandlerRootView` racine conservé (socle préservé) ; `npx tsc --noEmit` stable (aucune erreur introduite).

## Déviation / séquence

- D-07 partiellement dévié par nécessité : STAB-01 (avatar) n'a pas pu être validé sur #15/#16 (bug préexistant non corrigé). STAB-02/03 corrigés serveur (migration 011) et validés sur #16. Le build #17 a embarqué le correctif avatar (expo-file-system legacy) + le socle natif.
- **STAB-01 reste OUVERT** : l'avatar crashe toujours sur #17 (crash NATIF du picker, confirmé sur #15 et #17). Le correctif JS legacy était nécessaire mais insuffisant. Diagnostic natif en cours (log de crash device requis). Un build #18 embarquera le correctif natif + le retrait du smoke test (déjà committé).

## Self-Check: PASSED (FOND-01/FOND-02 validés sur device) — STAB-01 traité hors de ce plan

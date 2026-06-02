# Phase 3: Création & Détail de point (sheets natifs) — Research

**Researched:** 2026-06-02
**Domain:** Expo Router native form sheets (react-native-screens), navigation restructure, native dismiss interception, keyboard-in-sheet, Mapbox PointAnnotation → route migration
**Confidence:** HIGH on navigation structure + sheet options; HIGH on dismiss mechanism (decisive issue found); MEDIUM on iOS 26 device-rendering edge cases (must validate on TestFlight)

> **This file does NOT re-research what is already locked.** The 4 critical unknowns from the phase brief are answered concretely below with verified sources. Stack basics, the form-sheet-vs-gorhom decision, haptics mapping, safe-area and Dynamic Type strategy are already covered in `.planning/research/ARCHITECTURE.md` and `.planning/research/PITFALLS.md` — **reuse them, do not duplicate.**

---

<user_constraints>
## User Constraints (from CONTEXT.md + UI-SPEC.md — LOCKED)

### Locked Decisions (D-01 … D-10)
- **D-01:** Form sheet natif Expo Router (`react-native-screens`, `presentation: 'formSheet'`). **ZÉRO nouvelle dépendance.** `@gorhom/bottom-sheet` écarté (REQUIREMENTS Out of Scope + bugs compat SDK 54).
- **D-02:** Détent unique large `[0.92]` (~0.9, ≥ 0.7) pour création ET détail. Pas de détent medium.
- **D-03:** Poignée iOS visible (`sheetGrabberVisible: true`), coins natifs (`sheetCornerRadius: 28`). Aucun `borderRadius` forcé sur le conteneur. Identité éditoriale à l'INTÉRIEUR.
- **D-04:** Fermeture par swipe → **confirmation « Abandonner ce moment ? » si saisie non vide** (création + édition détail). Lecture détail = fermeture directe.
- **D-05:** Migrer `point/new` + `point/[id]` de `Tabs.Screen href:null` → **Stack parent + form-sheets natifs**.
- **D-06:** Tap pin → ouvre directement le sheet de détail. **Modal custom de `PointMarker.tsx` SUPPRIMÉE.** `onSelected` → `router.push`.
- **D-07:** **Logique métier intacte** : partenaire obligatoire, RPC `create_point`, consentement `is_visible` (trigger), suppression, date saisie. AUCUN changement de flux/DB.
- **D-08:** Carnet sobre/suggéré (typo + hiérarchie). **Pas de skeuomorphisme.** Suppression de l'`innerBorder`.
- **D-09:** Création ≠ détail (traitements distincts, pas de gabarit partagé).
- **D-10:** Création s'ouvre sur la NOTE (serif géant, geste central).

### Claude's Discretion (figé en UI-SPEC)
- Clavier + scroll interne : `KeyboardAvoidingView` + `ScrollView` RN standard (PAS gorhom). Le sheet ne se redimensionne pas au clavier → scroll interne.
- Boutons d'action **inline en fin de flux scrollable** — PAS de footer sticky.
- Détent exact `0.92`, `sheetCornerRadius: 28`.
- Mode édition + photos conservés.
- FAB + long-press carte → ouvrent le même sheet de création.

### Deferred Ideas (OUT OF SCOPE)
- Migration `FiltersBottomSheet` / `FriendSelector` en sheets natifs (Phase 4+).
- Carnet texturé/skeuomorphique (grain papier, lignes de cahier).
- Refonte de la gestion des photos.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| IOS-01 | Bottom sheets natifs `formSheet` (poignée, swipe-to-dismiss, détents ≥ 0.7) | §Unknown 1 (structure + options vérifiées) ; détent `[0.92]` confirmé valide SDK 54 |
| IOS-02 | Swipe natif via migration Modal custom → routes Stack | §Unknown 1 (Stack parent) + §Unknown 4 (suppression Modal PointMarker, `onSelected` → route) |
| UI-03 | `point/new` archétype « page de carnet » | §Unknown 2 (clavier dans sheet) + UI-SPEC §Page Composition Création |
| UI-04 | `point/[id]` archétype « page de carnet » | §Unknown 4 (suppression backBtn) + UI-SPEC §Page Composition Détail |
</phase_requirements>

---

## Summary

Les 4 inconnues critiques sont **toutes résolues avec des sources vérifiées**, et l'une d'elles change matériellement le plan : **le mécanisme de confirmation de fermeture (D-04) a un trou documenté sur notre version exacte de `react-native-screens` (4.16.0)**.

1. **Restructure navigation (IOS-01/02) :** il n'existe **pas d'approche plus légère** que le pattern canonique « Stack parent + groupe `(tabs)` + routes sheet sœurs ». `point/new` et `point/[id]` doivent devenir des `Stack.Screen` avec `presentation:'formSheet'` au niveau du `_layout` `(app)`, et les onglets actuels doivent descendre dans un sous-dossier de groupe `app/(app)/(tabs)/`. Les options sheet de l'UI-SPEC (`sheetAllowedDetents:[0.92]`, `sheetGrabberVisible`, `sheetCornerRadius:28`) sont **toutes valides** sur Expo Router 6 / react-native-screens 4.16.

2. **Clavier dans le sheet :** la pile verrouillée (`KeyboardAvoidingView behavior="padding"` + `ScrollView` RN, **pas** gorhom) est correcte et déjà à moitié en place dans `point/new.tsx`. Une seule nuance : `keyboardVerticalOffset={0}` (aucun header natif dans le sheet). Aucune nouvelle dépendance requise — les alternatives (`react-native-keyboard-controller`) seraient des deps interdites par D-01.

3. **Interception de la fermeture (D-04) — DÉCISIF :** utiliser **`usePreventRemove(isDirty, callback)`** (React Navigation v7). Vérifié : le callback **se déclenche bien au swipe-down** d'un `formSheet` natif. **MAIS** un bug ouvert (`react-native-screens` #3568, **reproduit en 4.16.0**) fait que **le callback NE se déclenche PAS quand l'utilisateur tape le backdrop** (la zone grisée au-dessus du sheet) → le formulaire est abandonné **sans confirmation**. La garde D-04 couvre donc le swipe + le lien tertiaire, **mais pas le tap-backdrop**. À décider par le planner (accepter le edge-case vs mitiger).

4. **Suppression de la Modal `PointMarker` (IOS-02/D-06) :** sûr. `onSelected` peut `router.push` la route détail. Conserver `setSelected(true)` + `refresh()` (état visuel Phase 2). **Un quirk subtil** : après fermeture du sheet, le pin reste `selected`, et re-taper un `PointAnnotation` déjà sélectionné peut ne pas re-déclencher `onSelected` sur iOS → réinitialiser `selected` à la fermeture pour permettre la réouverture.

**Primary recommendation:** Restructurer en `app/(app)/_layout.tsx` = `<Stack>` + `app/(app)/(tabs)/_layout.tsx` = `<Tabs>` (déplacés) + `point/new` & `point/[id]` déclarés `formSheet`. Implémenter D-04 via `usePreventRemove`, **documenter explicitement la fuite tap-backdrop (#3568)**, et éviter d'ouvrir un RN `Modal` (le `DatePickerModal` du mode édition) tant qu'un `usePreventRemove` est actif (risque de freeze iOS #2125).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Présentation sheet (chrome, détents, swipe) | Native iOS (`UISheetPresentationController` via react-native-screens) | — | C'est tout l'intérêt de D-01 : vrai sheet natif, pas une vue JS |
| Routing / présentation des routes | Expo Router (Stack natif) | — | Les sheets sont des routes (URL, deep-link notif, back natif) |
| Interception dismiss (D-04) | JS (React Navigation `usePreventRemove`) | Native (le geste swipe remonte à JS) | La logique « dirty ? » est métier → JS |
| Logique métier (RPC, consentement, delete) | Hooks (`usePoints`) + Supabase RPC/trigger | — | D-07 : inchangée, déjà hors composants (règle projet 4) |
| Clavier / scroll interne | JS (`KeyboardAvoidingView` + `ScrollView`) | — | Le sheet natif ne resize pas → compensé côté JS |
| Rendu pin + sélection | Native Mapbox (`PointAnnotation` snapshot) | JS (`router.push` au tap) | Phase 2 ; la navigation est le seul ajout JS |

---

## Standard Stack

**Aucune nouvelle dépendance (D-01).** Tout est déjà installé. Versions vérifiées dans `.planning/research/ARCHITECTURE.md` (lues depuis `package.json`).

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `expo-router` | `~6.0.23` | Stack natif + `presentation:'formSheet'` | Déjà la nav du projet ; intègre sheets au routing |
| `react-native-screens` | `~4.16.0` | Moteur natif des form sheets + gestes | Sous-jacent d'expo-router ; expose `sheet*` options |
| `react-native-safe-area-context` | `~5.6.0` | `useSafeAreaInsets()` (home indicator) | Règle projet ; déjà partout |
| `react-native` (`KeyboardAvoidingView`, `ScrollView`, `Alert`) | `0.81.5` | Clavier, scroll, alerte de confirmation native | Primitives RN, zéro dep |
| `@react-navigation/native` (`usePreventRemove`) | (transitif d'expo-router 6 / RN v7) | Interception dismiss D-04 | Hook officiel v7, remplace `beforeRemove` manuel |
| `expo-haptics` via `lib/haptics` | `~15.0.8` | `haptics.warn/success/error` | Déjà câblé (Phase 1) |
| `@rnmapbox/maps` | `^10.3.1` | `PointAnnotation.onSelected` → route | Inchangé Phase 2 |

### Alternatives Considered (et rejetées)
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `KeyboardAvoidingView` + `ScrollView` | `react-native-keyboard-controller` / `react-native-keyboard-aware-scroll-view` | **Nouvelle dépendance native** → interdit par D-01 (zéro dep) + rebuild EAS. Le pattern RN suffit. `[CITED: docs.expo.dev/guides/keyboard-handling]` |
| `usePreventRemove` | `navigation.addListener('beforeRemove', …)` + `preventDefault()` | Équivalent fonctionnel (le hook l'enveloppe). Le hook est l'API recommandée v7 — préférer. `[CITED: reactnavigation.org/docs/use-prevent-remove]` |
| Form sheet natif | `@gorhom/bottom-sheet` | Out of Scope + bugs SDK 54 (déjà tranché D-01 / ARCHITECTURE.md) |

**Installation :** *(aucune)* — `npm install` n'ajoute rien. Conséquence directe : **pas de rebuild natif requis pour Phase 3 si rien d'autre ne change** → l'OTA `eas update` reste valable (pivot D-01). Voir §Common Pitfalls — vérifier qu'aucun changement natif ne se glisse.

## Package Legitimacy Audit

> Aucun package externe installé dans cette phase (D-01 = zéro nouvelle dépendance). **Audit non requis / vacuously safe.** Toutes les libs utilisées sont déjà présentes, vérifiées dans la recherche projet existante. Le planner ne doit insérer aucun `checkpoint:human-verify` d'installation.

---

## Architecture Patterns

### System Architecture Diagram

```
                         app/_layout.tsx  (ROOT <Stack>, GestureHandlerRootView déjà en place)
                                  │
                                  ▼
                    app/(app)/_layout.tsx   ←──  DEVIENT  <Stack screenOptions={{ headerShown:false, contentStyle:{ backgroundColor: T.bg } }}>
                                  │
            ┌─────────────────────┼───────────────────────────────┐
            ▼                     ▼                                ▼
   Stack.Screen "(tabs)"   Stack.Screen "point/new"        Stack.Screen "point/[id]"
   (le groupe d'onglets)   presentation:'formSheet'         presentation:'formSheet'
            │               sheetAllowedDetents:[0.92]       (mêmes options sheet)
            ▼               sheetGrabberVisible:true
   app/(app)/(tabs)/_layout.tsx (<Tabs>)   sheetCornerRadius:28
            │               gestureEnabled:true
   ┌────────┼────────┬───────────┬─────────────┐
   ▼        ▼        ▼           ▼             ▼
 map/    point/   friends/   profile/   friends/requests
 index   list     index      index      (href:null, reste caché)

   FLUX D'OUVERTURE
   ─────────────────
   FAB / long-press carte ──router.push('/(app)/point/new',{params:gps})──▶ sheet création (slide-up natif)
   tap PointAnnotation     ──onSelected → router.push('/(app)/point/'+id)─▶ sheet détail (slide-up natif)
   notif (app/_layout)     ──router.push('/(app)/point/'+pointId)─────────▶ sheet détail  (inchangé, marche)

   FLUX DE FERMETURE
   ─────────────────
   swipe-down / poignée ──▶ usePreventRemove(isDirty) ──dirty?──▶ Alert « Abandonner ? » (preventDefault)
                                                       └─clean?──▶ ferme, retour sur (tabs)/map
   tap backdrop          ──▶ ⚠️ #3568 : NE déclenche PAS le callback → ferme sans confirmation
```

### Recommended Project Structure (la migration exacte — D-05)

```
app/(app)/
├── _layout.tsx              # ⟵ RÉÉCRIT : <Stack> (était <Tabs>). Déclare (tabs) + 2 sheets.
├── (tabs)/                  # ⟵ NOUVEAU dossier de groupe (URL transparente)
│   ├── _layout.tsx          # ⟵ DÉPLACÉ ICI : le <Tabs> actuel (sans les 2 href:null point/*)
│   ├── map/index.tsx        # ⟵ DÉPLACÉ (chemin change, URL /(app)/map inchangée)
│   ├── point/list.tsx       # ⟵ DÉPLACÉ
│   ├── friends/index.tsx    # ⟵ DÉPLACÉ
│   ├── friends/requests.tsx # ⟵ DÉPLACÉ (reste href:null dans le Tabs)
│   └── profile/index.tsx    # ⟵ DÉPLACÉ
└── point/
    ├── new.tsx              # ⟵ RESTE ICI (sœur du groupe (tabs)), présenté en formSheet
    └── [id].tsx             # ⟵ RESTE ICI, présenté en formSheet
```

> **Pourquoi pas plus léger ?** Un `Tabs.Screen` ne peut pas porter `presentation:'formSheet'` (c'est une option de Stack natif, pas de Tabs). Pour qu'un sheet glisse PAR-DESSUS la tab bar et revienne sur l'onglet, la route sheet doit être **sœur du groupe d'onglets dans un Stack** (PITFALLS §Native Sheets 4). Déclarer les sheets au niveau racine `app/` à la place perdrait la garde de session de `(app)/_layout`. Le pattern « `(tabs)` + sheet sœur » est le pattern Expo Router canonique et **la seule structure correcte**. **Confiance : HIGH.**

> **Groupes & URLs :** `(tabs)` est un segment de **groupe** → invisible dans l'URL. `router.replace('/(app)/map')` et `router.push('/(app)/point/'+id)` **continuent de résoudre** (map n'existe qu'à un seul endroit → pas d'ambiguïté). Le planner DOIT lancer `tsc` après le déplacement pour attraper toute rupture de route typée, et tester le deep-link notification (`app/_layout.tsx` ligne 88 : `router.push('/(app)/point/${data.pointId}')` → ouvre désormais le **sheet** détail, comportement désiré).

### Pattern 1 : `_layout` (app) en Stack avec sheets (IOS-01 / D-01..D-03)
```tsx
// app/(app)/_layout.tsx  (NOUVEAU — la garde de session reste ici, identique)
// Source: [CITED: docs.expo.dev/router/advanced/modals] + [CITED: reactnavigation.org/docs/native-stack-navigator]
import { Stack, router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

export default function AppLayout() {
  const { session, loading } = useAuthStore();
  const T = useTheme();
  useEffect(() => { if (!loading && !session) router.replace('/(auth)/login'); }, [session, loading]);
  if (!session) return null;

  const sheetOptions = {
    presentation: 'formSheet',
    sheetAllowedDetents: [0.92],   // détent unique large (D-02 ; ≥0.7 atténue #3235)
    sheetGrabberVisible: true,      // D-03
    sheetCornerRadius: 28,          // D-03 (= T.radiusXl)
    gestureEnabled: true,           // swipe-to-dismiss natif (IOS-01)
    headerShown: false,             // header éditorial interne
  } as const;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="point/new"  options={sheetOptions} />
      <Stack.Screen name="point/[id]" options={sheetOptions} />
    </Stack>
  );
}
```
> `contentStyle: { backgroundColor: T.bg }` mitige le flash de fond au swipe (ARCHITECTURE §Gestures + PITFALLS). Le `<Tabs>` actuel (lignes 72-117 de l'ancien `_layout.tsx`) part **tel quel** dans `app/(app)/(tabs)/_layout.tsx`, en **retirant** les deux lignes `Tabs.Screen name="point/new"/"point/[id]" href:null` (devenues des routes Stack), et en gardant `friends/requests href:null`.

### Pattern 2 : Garde de fermeture D-04 via `usePreventRemove`
```tsx
// Dans point/new.tsx (et le mode édition de point/[id].tsx)
// Source: [CITED: reactnavigation.org/docs/use-prevent-remove]
import { usePreventRemove } from '@react-navigation/native';
import { Alert } from 'react-native';
import { haptics } from '@/lib/haptics';

// "dirty" création = exactement l'état UI-SPEC :
const isDirty =
  comment.trim() !== '' ||
  durationMinutes !== '' ||
  note !== 7 ||
  selectedPartnerId !== null;

usePreventRemove(isDirty, ({ data }) => {
  haptics.warn();
  Alert.alert(
    'Abandonner ce moment ?',
    'Votre saisie ne sera pas enregistrée.',
    [
      { text: "Continuer l'écriture", style: 'cancel' },
      { text: 'Abandonner', style: 'destructive',
        onPress: () => navigation.dispatch(data.action) }, // exécute le dismiss bloqué
    ],
  );
});
```
> **Vérifié :** ce callback **se déclenche au swipe-down** du formSheet natif (react-native-screens #3568 confirme « interactively dismiss / swipe → callback properly called »). Le lien tertiaire « Abandonner la saisie » appelle simplement `router.back()` → passe aussi par la garde. **Confiance : HIGH** (swipe + lien). Voir §Common Pitfalls #1 pour la fuite tap-backdrop.

### Pattern 3 : Suppression de la Modal PointMarker (IOS-02 / D-06)
```tsx
// components/map/PointMarker.tsx — APRÈS (le bloc <Modal>…</Modal> et ses styles disparaissent)
// Source: code projet (PointMarker.tsx lignes 138-148) + ARCHITECTURE §Gestures
<MapboxGL.PointAnnotation
  ref={annRef}
  id={point.id}
  coordinate={[point.longitude, point.latitude]}
  anchor={{ x: 0.5, y: 1 }}
  selected={selected}
  onSelected={() => { setSelected(true); router.push(`/(app)/point/${point.id}`); }}
  onDeselected={() => setSelected(false)}
>
  {selected ? <PinIconSelected T={T} /> : <PinIcon T={T} />}
</MapboxGL.PointAnnotation>
```
> Conserver `useEffect(() => { annRef.current?.refresh(); }, [selected])` (re-snapshot Phase 2). Retirer `modalVisible`/`setModalVisible` et tout l'arbre `<Modal>`. **Les props `isOwner`/`onDelete` deviennent inutilisées** → les retirer de l'interface `Props` ET de l'appel dans `map/index.tsx` ligne 109. Voir §Runtime State Inventory pour le code mort induit.

### Anti-Patterns to Avoid
- **Déclarer les sheets dans le mauvais Stack** (ex. racine `app/`) → pousse en plein écran, casse le retour onglet (PITFALLS §Native Sheets 4).
- **Forcer un `borderRadius` sur le conteneur du sheet** → casse le chrome natif iOS 26 (D-03). Le rayon = `sheetCornerRadius` natif uniquement.
- **`BottomSheetScrollView` / `BottomSheetTextInput`** → propres à gorhom (non installé). Utiliser `ScrollView`/`TextInput` RN (UI-SPEC §Keyboard).
- **Ajouter `insets.top` en padding À L'INTÉRIEUR du sheet** → le sheet démarre déjà sous la poignée ; doubler l'inset enfonce le contenu. `point/new.tsx` (header `paddingTop: insets.top + 24`) et les états `centered` de `point/[id].tsx` (`paddingTop: insets.top`) doivent **retirer** le `insets.top` une fois en sheet. Garder `insets.bottom` pour le home indicator.
- **Footer sticky avec CTA** → se bat avec le clavier dans un sheet qui ne resize pas (UI-SPEC §Action Placement : tout inline-fin).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bottom sheet (poignée, détents, swipe) | Une `Modal` RN custom (l'actuelle de PointMarker) | `presentation:'formSheet'` natif | Le natif donne grabber + swipe + détents + intégration routing gratuitement (c'est tout IOS-01) |
| Interception swipe-to-dismiss | Un `PanResponder` / listener de geste maison | `usePreventRemove(isDirty, cb)` | Hook officiel v7, branché sur le geste natif |
| Évitement clavier | Calcul manuel de hauteur clavier + `translateY` | `KeyboardAvoidingView` + `ScrollView` | Pattern RN éprouvé, zéro dep (D-01) |
| Confirmation destructive | Une modale custom | `Alert.alert(..., [{style:'destructive'}])` | Alerte native iOS (déjà utilisée dans `point/[id]` handleDelete) |

**Key insight :** Phase 3 est une phase de **suppression de code custom** (la Modal de PointMarker, le bouton retour flottant, l'innerBorder) au profit de primitives natives. Ne réintroduire aucune mécanique JS pour ce que le sheet natif fait déjà.

## Runtime State Inventory

> Phase de refactor/migration de présentation → inventaire requis. Ici l'« état » est surtout du **code mort induit** et des **chemins de fichiers**, pas des données stockées.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | **Aucun** — D-07 garantit zéro changement DB/RPC/trigger. Les points, consentements, partenaires restent identiques. Vérifié : `point/new` appelle toujours `createPoint`→RPC, `point/[id]` appelle `handleConsent`/`deletePoint` inchangés. | none |
| Live service config | **Aucun** — pas de service externe touché (Mapbox style, Supabase schema inchangés). | none |
| OS-registered state | **Aucun** — pas de tâche/notif registry. Le handler de notif (`app/_layout.tsx` l.88) `router.push('/(app)/point/${pointId}')` **fonctionne tel quel** et ouvre désormais le sheet (désirable, pas un changement de registration). | none — vérifier au test |
| Secrets/env vars | **Aucun** — aucun nom de clé/env touché. | none |
| Build artifacts / code mort | **(1)** Le bloc `<Modal>` + styles `overlay/sheet/handle/noteRow/.../deleteBtn` de `PointMarker.tsx` (l.150-234, l.240-369). **(2)** Props `isOwner`/`onDelete` de `PointMarker` → inutilisées. **(3)** `map/index.tsx` : `handleDelete` (l.95-103) + l'import/usage de `deletePoint` deviennent potentiellement **morts** (seul `PointMarker` les consommait via la Modal). **(4)** `backBtn` + style `backBtn` (`point/[id].tsx` l.201-204, l.393-403) supprimés (D-06/UI-SPEC). **(5)** Imports devenus inutiles : `Modal`, `TouchableWithoutFeedback`, `IcoTrash` dans PointMarker ; `IcoArrow dir="left"` côté backBtn. | **code edit** : suppression propre + `tsc`/eslint pour traquer les imports/vars orphelins. Le planner doit prévoir une tâche de nettoyage explicite. |

**Le détail destruction propriétaire reste accessible :** la suppression d'un point se faisait dans 2 endroits (Modal PointMarker ET détail `point/[id]`). En retirant la Modal, **la suppression ne vit plus que dans le sheet détail** (`handleDelete`, `point/[id].tsx` l.100-114) — c'est exactement le flux UI-SPEC (« Effacer cette page » inline-fin). Donc `map/index.tsx handleDelete` peut être supprimé **sans perte de fonctionnalité**. Confirmer que `deletePoint` reste importé là où il sert encore (il est aussi déstructuré pour rien si seul `handleDelete` l'utilisait → vérifier).

## Common Pitfalls

### Pitfall 1 : Le tap-backdrop contourne la confirmation D-04 (react-native-screens #3568) — HIGH
**What goes wrong :** `usePreventRemove`/`beforeRemove` se déclenche au **swipe-down** mais **PAS quand l'utilisateur tape le backdrop grisé** au-dessus du sheet → le formulaire de création se ferme **sans** l'Alert « Abandonner ce moment ? », perte de saisie silencieuse.
**Why it happens :** bug ouvert `react-native-screens` #3568, **reproduit en 4.16.0 → 4.20.0** (notre version exacte est 4.16.0). Le dismiss par backdrop ne propage pas l'événement à JS.
**How to avoid :**
- **Option A (accepter) :** au détent `0.92`, le backdrop n'est qu'une bande ~8% en haut → tap accidentel rare. Documenter comme edge-case connu, ne pas bloquer la phase. *(recommandé — cohérent avec D-01 zéro-dep)*
- **Option B (atténuer) :** suivre #3568 et **épingler `react-native-screens`** dès qu'un fix sort. Ne pas downgrade (régressions).
- **Option C (lourd, déconseillé) :** persister l'état du formulaire pour le restaurer à la réouverture — hors périmètre, casse la métaphore « page abandonnée ».
**Warning signs :** en test device, taper la zone sombre au-dessus du sheet ferme la création sans alerte alors que le swipe l'affiche bien.
**Décision à remonter au planner / discuss-phase :** valider l'Option A (accepter) ou planifier l'Option B. **L'affirmation UI-SPEC « beforeRemove couvre swipe-down ET tap Abandonner » est exacte mais incomplète** — elle ne mentionne pas le tap-backdrop.

### Pitfall 2 : `DatePickerModal` (RN Modal) + `usePreventRemove` actif → freeze iOS (#2125) — MEDIUM/HIGH
**What goes wrong :** le mode édition de `point/[id].tsx` ouvre un `DatePickerModal` (react-native-paper-dates = un RN `Modal`/portal) **pendant** que la garde `usePreventRemove` (édition dirty) est active. Issue `react-native-screens` #2125 : l'app **gèle** quand un RN `Modal` est présenté alors qu'un écran prévient son remove via `usePreventRemove` sur iOS.
**Why it happens :** conflit entre la présentation native du Modal et le mécanisme de prévention de dismiss du sheet sous-jacent.
**How to avoid :**
- N'activer `usePreventRemove` du mode édition **que** quand le `DatePickerModal` est fermé (ex. `usePreventRemove(isEditDirty && !showDatePicker, …)`), OU
- Remplacer le picker date d'édition par les **3 segments mono JJ/MM/AAAA** (cohérent avec la création, élimine le Modal et la dep `react-native-paper-dates` sur cet écran — bonus discipline UI-SPEC).
**Warning signs :** ouvrir le date-picker en mode édition gèle l'UI (plus aucun tap ne répond) sur device iOS.
**Recommandation :** privilégier la 2e option (segments date) → supprime la cause racine ET harmonise création/détail.

### Pitfall 3 : Pin reste « selected » après fermeture → ré-ouverture impossible — MEDIUM
**What goes wrong :** `onSelected` `router.push` le détail. À la fermeture du sheet, la carte est restée montée dessous, le `PointAnnotation` est toujours `selected=true`. Re-taper un `PointAnnotation` **déjà sélectionné** ne re-déclenche pas toujours `onSelected` sur iOS (quirk rnmapbox) → l'utilisateur tape le même pin et rien ne s'ouvre.
**Why it happens :** Mapbox ne ré-émet pas `onSelected` pour une annotation déjà dans l'état sélectionné.
**How to avoid :** déselectionner à la fermeture du sheet. Pratique : laisser `onDeselected` faire son `setSelected(false)` (Mapbox déselectionne quand on tape ailleurs/la carte), et si besoin forcer `setSelected(false)` au retour (ex. `useFocusEffect` sur la carte qui reset les sélections, ou écouter le dismiss). **À tester sur device** (divergence simulateur, cf. PITFALLS §Clustering 1).
**Warning signs :** ouvrir un point, fermer, re-taper le même point → rien. Taper un autre point puis revenir → marche.

### Pitfall 4 : `formSheet` rabougri sur iOS 26 (#3235) — MEDIUM (déjà mitigé)
**What goes wrong :** sur iOS 26 + react-native-screens 4.16.0, un formSheet à petit détent se rend trop petit.
**How to avoid :** **déjà mitigé** par le choix `sheetAllowedDetents:[0.92]` (≥0.7, choisi haut exprès — UI-SPEC §Native Sheet Config). **Valider sur device iOS 26 / TestFlight**, pas seulement simulateur. (Détail complet : PITFALLS §Native Sheets 1.)

### Pitfall 5 : Régressions thème + safe-area + Dynamic Type au restylage — MEDIUM (transverse)
Déjà documenté en détail dans PITFALLS §Redesign 2/3/4. Rappels Phase 3 : tester dark **ET** light sur les 2 sheets ; aucun hex/`fontFamily` en dur ; `makeStyles(T)` mémoïsé ; remplacer `F.sansMedium`/`F.sans` des boutons consentement par serif/mono (UI-SPEC §Typography) ; pas de `height` fixe sur conteneurs de texte.

## Code Examples

### Déclaration sheet (rappel concis, options vérifiées)
```tsx
// Source: [CITED: docs.expo.dev/router/advanced/modals]
<Stack.Screen
  name="point/new"
  options={{
    presentation: 'formSheet',
    sheetAllowedDetents: [0.92],        // number[] 0–1 (vérifié)
    sheetGrabberVisible: true,          // boolean, iOS (vérifié)
    sheetCornerRadius: 28,              // number px (vérifié)
    gestureEnabled: true,               // native-stack option (vérifié RN native-stack)
    headerShown: false,
  }}
/>
```

### Clavier dans le sheet (pattern verrouillé, déjà ~en place dans point/new.tsx)
```tsx
// Source: [CITED: docs.expo.dev/guides/keyboard-handling] + UI-SPEC §Keyboard
<KeyboardAvoidingView
  style={{ flex: 1, backgroundColor: T.bg }}
  behavior={Platform.OS === 'ios' ? 'padding' : undefined}
  keyboardVerticalOffset={0}           // aucun header natif dans le sheet
>
  <ScrollView
    keyboardShouldPersistTaps="handled"
    showsVerticalScrollIndicator={false}
    contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}  // home indicator + clôture
  >
    {/* note → commentaire → partenaire → durée → date → lieu → CTA inline-fin */}
  </ScrollView>
</KeyboardAvoidingView>
```
> `point/new.tsx` a déjà `KeyboardAvoidingView` + `ScrollView` (l.174-178) : il reste à ajouter `keyboardVerticalOffset={0}`, le `contentContainerStyle` de bas de page, et retirer le `insets.top` du header (le sheet gère le haut). Le mode édition de `point/[id].tsx` (qui n'a PAS de KAV aujourd'hui) doit être enveloppé d'un `KeyboardAvoidingView` pour ses `TextInput`.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Modal` RN custom pour aperçu/sheet | `presentation:'formSheet'` natif (route) | react-native-screens 4.x (2024) | Grabber/swipe/détents natifs gratuits ; supprime du code |
| `navigation.addListener('beforeRemove')` + `preventDefault()` | `usePreventRemove(shouldPrevent, callback)` | React Navigation v7 | API hook recommandée, même moteur sous le capot |
| Bouton retour flottant custom | Swipe-down / poignée native | D-06 / IOS-02 | Geste natif, moins de chrome |

**Deprecated/outdated dans le contexte de ce repo :**
- La note PITFALLS « `react-native-reanimated`/`gesture-handler` absents » est **périmée** : installés depuis Phase 1, racine wrappée `GestureHandlerRootView` (vérifié `app/_layout.tsx` l.5/107). Confirmé par UI-SPEC §Note de stack.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `gestureEnabled`/`contentStyle` (non listés sur la page Modals d'Expo) sont des options native-stack valides passées par expo-router | §Pattern 1 / Code Examples | Faible — ce sont des options React Navigation native-stack standard ; si ignorées, le swipe reste actif par défaut iOS et le flash de fond peut réapparaître (cosmétique). Vérifier au `tsc`. |
| A2 | Déplacer les onglets dans `(tabs)` ne casse pas `router.replace('/(app)/map')` ni les routes typées | §Project Structure | Moyen — résolu par `tsc` + test runtime ; map est unique donc pas d'ambiguïté de groupe attendue. |
| A3 | Le handler de notif (`router.push('/(app)/point/${pointId}')`) ouvre le sheet sans modif | §Runtime State Inventory | Faible — `router.push` vers une route sheet sœur résout ; à confirmer au test deep-link. |

**Note :** A1–A3 sont des points à **confirmer au `tsc` + test device**, pas des décisions utilisateur. Aucune hypothèse de compliance/sécurité/perfo non vérifiée.

## Open Questions (RESOLVED)

> **RESOLVED (2026-06-02) :** Q1 → **Option A acceptée** (edge-case tap-backdrop #3568 documenté, threat model T-03-07). Q2 → **segments JJ/MM/AAAA** (implémenté en 03-04 T1, supprime le risque de freeze #2125).

1. **Mitigation du tap-backdrop (#3568) — décision produit**
   - Ce qu'on sait : swipe-down déclenche la garde ; tap-backdrop non (4.16.0 affecté).
   - Ce qui est flou : seuil d'acceptabilité du edge-case pour Louis.
   - Recommandation : **accepter (Option A)** et documenter ; suivre #3568 pour un futur pin de version. À valider en discuss/plan.

2. **Date d'édition : garder `DatePickerModal` ou passer aux segments JJ/MM/AAAA ?**
   - Ce qu'on sait : `DatePickerModal` + `usePreventRemove` actif = risque de freeze iOS (#2125).
   - Recommandation : **segments date** (supprime la cause + harmonise avec la création). Sinon, conditionner la garde sur `!showDatePicker`.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `expo-router` (Stack natif) | sheets, routing | ✓ | ~6.0.23 | — |
| `react-native-screens` (sheet engine) | `presentation:'formSheet'` | ✓ | ~4.16.0 | — (affecté #3568/#3235, mitigé) |
| `usePreventRemove` (React Navigation v7) | D-04 | ✓ (transitif) | v7 | `beforeRemove` listener manuel (équivalent) |
| `react-native-safe-area-context` | home indicator | ✓ | ~5.6.0 | — |
| `expo-haptics` / `lib/haptics` | warn/success/error | ✓ | ~15.0.8 | — |

**Missing dependencies with no fallback :** aucune.
**Missing dependencies with fallback :** aucune — D-01 garantit zéro nouvelle dépendance. **Conséquence livraison :** si Phase 3 n'introduit AUCUN natif, l'OTA `eas update` reste valable (pas de bump `runtimeVersion` requis). Le planner doit **vérifier** qu'aucune tâche n'ajoute de module natif par inadvertance (sinon → rebuild + bump, PITFALLS §Redesign 1, CRITIQUE).

## Validation Architecture

> `nyquist_validation` traité comme actif. **Ce projet n'a AUCUN framework de test automatisé** (vérifié : pas de `pytest`/`jest`/`vitest`, pas de répertoire `__tests__`). La validation repose sur **gates statiques** + **checklist manuelle TestFlight**. Cette section devient le VALIDATION.md de la phase.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **Aucun** (pas d'infra de test unitaire) |
| Config file | none |
| Quick run command | `npx tsc --noEmit` (type-check) + `npx eslint .` |
| Full suite command | `npx tsc --noEmit && npx eslint . && eas build` (build natif uniquement si natif touché) |

### Phase Requirements → Validation Map
| Req ID | Behavior | Test Type | Gate / Commande | Existe ? |
|--------|----------|-----------|-----------------|----------|
| IOS-01 | Sheet création/détail s'ouvre en formSheet, poignée visible, swipe ferme | manual (device iOS 26) | TestFlight : ouvrir FAB → sheet glisse du bas, poignée, détent ~0.9 ; swipe-down ferme | ✅ manuel |
| IOS-01 | Détent `[0.92]` ne se rend pas rabougri (iOS 26 #3235) | manual (device) | TestFlight : vérifier remplissage correct sur device iOS 26 réel | ✅ manuel |
| IOS-02 | Tap pin → sheet détail direct (plus de Modal) | manual | TestFlight : taper un pin → détail s'ouvre ; re-taper après fermeture → rouvre (Pitfall 3) | ✅ manuel |
| IOS-02 | Restructure Stack compile, routes résolvent | static | `npx tsc --noEmit` (aucune erreur de route) | ✅ static |
| UI-03 | Création carnet (note-first), clavier ne masque pas commentaire | manual | TestFlight : focus commentaire/date → champ reste visible au-dessus du clavier | ✅ manuel |
| UI-03 | D-04 : saisie dirty + swipe → Alert « Abandonner ? » | manual | TestFlight : saisir une note≠7, swipe-down → alerte ; vide → ferme direct ; **tap-backdrop → fuite connue #3568** | ✅ manuel |
| UI-04 | Détail lecture, plus de bouton retour flottant, dismiss natif | manual | TestFlight : pas de backBtn ; swipe ferme ; consentement/édition/delete OK | ✅ manuel |
| D-07 | Logique métier intacte (RPC create_point, consentement, delete, date) | manual | TestFlight : créer/consentir/supprimer un point fonctionne comme avant | ✅ manuel |
| transverse | Dark ET light corrects sur les 2 sheets | manual | TestFlight : toggle thème, inspecter les 2 sheets | ✅ manuel |
| transverse | Pas de hex/`fontFamily` en dur introduit | static | grep manuel / eslint | ✅ static |

### Sampling Rate
- **Per task commit :** `npx tsc --noEmit` (doit passer avant tout commit).
- **Per wave merge :** `npx tsc --noEmit && npx eslint .`.
- **Phase gate :** build dev-client + **checklist TestFlight device iOS 26** complète verte avant `/gsd:verify-work`. **Ne jamais valider un layout de sheet au simulateur seul** (PITFALLS §Native Sheets / Clustering).

### Wave 0 Gaps
- [ ] Aucun fichier de test à créer (pas de framework). Wave 0 = **vérifier que `tsc` et `eslint` passent sur l'état courant** avant migration, pour isoler les régressions introduites.
- [ ] Pas d'installation de framework de test (hors périmètre Phase 3).

## Security Domain

> Phase de présentation pure. Aucune nouvelle surface d'attaque : pas d'input réseau nouveau, pas de nouvelle requête, RLS/trigger/RPC inchangés (D-07).

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | non | garde de session inchangée (`(app)/_layout` la conserve) |
| V3 Session Management | non | inchangé |
| V4 Access Control | non (vérifier) | RLS Supabase inchangée ; `is_visible`/consentement via trigger (D-07) ; `creator_id === auth.uid()` côté serveur préservé |
| V5 Input Validation | marginal | mêmes champs (note, commentaire, durée, date) ; aucune nouvelle entrée. Validation existante (date parse, note bornée) conservée |
| V6 Cryptography | non | n/a |

### Known Threat Patterns for ce stack
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Bypass consentement (`is_visible` côté client) | Tampering | Inchangé : trigger SQL `on_partner_consent` seul maître ; aucun set client (règle projet) |
| Fuite `push_token`/`date_of_birth` d'autrui | Info Disclosure | Inchangé : `search_users` exclut ces colonnes ; détail ne lit que le point/partenaire concerné |

**Conclusion sécurité :** Phase 3 = **iso-sécurité**. Le seul point de vigilance fonctionnel (pas sécuritaire) est la fuite d'UX du tap-backdrop (#3568) → perte de saisie, pas de données exposées.

## Sources

### Primary (HIGH confidence)
- `.planning/research/ARCHITECTURE.md` — §Bottom Sheets (config formSheet, options vérifiées doc Expo), §Gestures (swipe-back, `contentStyle` flash), §Haptics. **LECTURE OBLIGATOIRE downstream.**
- `.planning/research/PITFALLS.md` — §Native Sheets (1 iOS 26 #3235, 2 clavier, 4 nesting), §Redesign (1 runtimeVersion CRITIQUE, 2/3/4 thème/Dynamic Type/safe-area).
- [Expo — Modals](https://docs.expo.dev/router/advanced/modals/) — options `sheetAllowedDetents`, `sheetInitialDetentIndex`, `sheetGrabberVisible`, `sheetCornerRadius`, `sheetLargestUndimmedDetentIndex` confirmées.
- [React Navigation — usePreventRemove](https://reactnavigation.org/docs/use-prevent-remove/) — API D-04.
- [React Navigation — Native Stack Navigator](https://reactnavigation.org/docs/native-stack-navigator/) — `gestureEnabled`, `presentation`, `contentStyle`.
- Code projet lu : `app/(app)/_layout.tsx`, `app/_layout.tsx`, `app/(app)/point/new.tsx`, `app/(app)/point/[id].tsx`, `app/(app)/map/index.tsx`, `components/map/PointMarker.tsx`.

### Secondary (MEDIUM confidence — issues GitHub, à valider device)
- [react-native-screens #3568 — usePreventRemove callback non appelé au tap-backdrop d'un formSheet (iOS, repro 4.16.0–4.20.0)](https://github.com/software-mansion/react-native-screens/issues/3568) — **décisif pour D-04**.
- [react-native-screens #2125 — freeze quand un RN Modal s'affiche avec usePreventRemove actif (iOS)](https://github.com/software-mansion/react-native-screens/issues/2125) — risque DatePickerModal édition.
- [react-navigation #13072 — usePreventRemove + swipe-back native-stack desync (SDK 55)](https://github.com/react-navigation/react-navigation/issues/13072) — signal de fragilité du mécanisme, tester device.
- [react-native-screens #3235 — formSheet trop petit iOS 26 (4.16.0 affecté)](https://github.com/software-mansion/react-native-screens/issues/3235).
- [Expo — Keyboard handling](https://docs.expo.dev/guides/keyboard-handling/) — KAV + ScrollView baseline.

### Tertiary (LOW — non utilisé pour décision)
- [facebook/react-native #26892 — pageSheet/formSheet swipe dismiss non propagé (vieux, iOS 13)](https://github.com/facebook/react-native/issues/26892) — historique, contexte.

## Metadata

**Confidence breakdown:**
- Navigation restructure (folder + Stack/Tabs/sheet) : **HIGH** — pattern Expo Router canonique, options sheet confirmées doc officielle, code projet lu.
- Sheet options validité SDK 54 : **HIGH** — doc Expo + ARCHITECTURE déjà vérifiée.
- Dismiss interception D-04 (`usePreventRemove` au swipe) : **HIGH** — confirmé fonctionnel par #3568 ; **MEDIUM** sur le edge-case backdrop (trou documenté, pas un échec du plan).
- Keyboard-in-sheet : **HIGH** — pattern locked + déjà partiellement implémenté, aucune dep.
- PointMarker migration : **HIGH** sur la mécanique ; **MEDIUM** sur le quirk de re-sélection (à tester device).
- iOS 26 device rendering : **MEDIUM** — mitigé par détent 0.92, à valider TestFlight.

**Research date:** 2026-06-02
**Valid until:** ~2026-07-02 (surveiller les fixes #3568/#3235 de react-native-screens ; re-vérifier si bump de `react-native-screens`/`expo-router`).

# Phase 5: Auth, Profil & Finitions - Research

**Researched:** 2026-06-02
**Domain:** React Native (Expo SDK 54) — refonte visuelle d'écrans existants (auth + profil) + passe de finitions iOS transverse (safe areas, home indicator, Dynamic Type plafonné, sweep de cohérence tokens) sur 9 écrans.
**Confidence:** HIGH (codebase intégralement lu/grepé ; aucune dépendance externe nouvelle ; contraintes verrouillées dans CONTEXT/UI-SPEC)

## Summary

Cette phase est une **refonte de présentation pure** : aucun changement de flux d'auth, aucune nouvelle capacité profil, aucune migration data, **zéro nouvelle dépendance**. Les trois écrans cibles (`login`, `register`, `profile/index`) existent et fonctionnent ; il s'agit de les re-styler selon l'archétype « page de couverture » et d'ajouter une tuile bento « nombre de moments » (déjà disponible comme `points.length`, aucun nouveau calcul). La passe IOS-04 est un **audit + sweep ciblé** sur 9 écrans.

Le risque dominant n'est pas technique mais **régressif** : l'upload d'avatar repose sur un pattern fragile (require dynamique d'`expo-image-picker` dans la fonction + `expo-file-system/legacy`, JAMAIS `requestMediaLibraryPermissionsAsync`) qui a causé plusieurs crashs TestFlight (#8/#11/#13). Ce pattern est présent **verbatim** dans `profile/index.tsx` et doit être **préservé intégralement**. Le levier Dynamic Type central (`AppText`) existe mais ne couvre pas le variant `display` requis par la couverture (Cover 56) — c'est le seul vrai ajout de composant.

L'audit IOS-04 révèle une bonne nouvelle : **zéro `SafeAreaView`** dans tout `app/` (la règle est déjà respectée), et **tous les 9 écrans utilisent `useSafeAreaInsets()` + `insets.top`**. Les vraies casses sont concentrées : (1) `login`/`register` n'utilisent **pas** `insets.bottom` (paddingBottom littéral 48 — risque home indicator car plein écran sans tab bar) ; (2) **aucun écran sauf `AppText` n'a de `maxFontSizeMultiplier`** ; (3) des valeurs d'espacement/typo hors-échelle et 3 usages de graisses hors-discipline.

**Primary recommendation :** Re-styler les 3 écrans en routant tout texte éditorial par `AppText` (après ajout du variant `display`), réutiliser `Button`/`Input`/`PressableScale` tels quels, préserver le bloc avatar **mot pour mot**, et cadrer le sweep IOS-04 sur les casses réelles listées dans l'audit baseline ci-dessous — sans réécrire ce qui est déjà cohérent.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01 (login)** : En-tête éditorial compact + champs **immédiatement visibles** (PAS sous la ligne de flottaison). Titre serif italic + eyebrow mono « LOVEMAP · ÉDITION INTIME », email/mot de passe en inputs underline visibles sans scroll, + CTA. Numéro d'édition/date mono en ourlet possible. Erreurs via **Snackbar**.
- **D-02 (register)** : Conserver le **stepper 2 étapes** (âge → formulaire, règle 10, trigger serveur `handle_new_user` inchangé). Step 1 (âge) en page de garde solennelle (grand serif + eyebrow), step 2 cohérent avec login. **Restyle uniquement, pas de changement de flux.**
- **D-03 (profil)** : Page de couverture personnelle — avatar **carré 80px** (initiale serif italic rose ou photo), nom en grand serif, @username en mono. **Avatar upload conservé via require dynamique d'`expo-image-picker` dans la fonction** (règles 14/15 STRICTES — JAMAIS `requestMediaLibraryPermissionsAsync()`, JAMAIS d'import statique).
- **D-04 (Analyse bento)** : Section « Analyse » en mini-bento éditorial. **GRANDE tuile = nombre de moments** (gros chiffre serif, « pages du carnet »). Autres tuiles : durée totale, distribution des notes (barres **monochromes + rose**), top 3 mois. **Monochrome discipliné** : niveaux de `T.surface` + un seul accent `T.primary`.
- **D-05 (réglages)** : Conserver toggle thème (IcoSun/IcoMoon), édition email/mot de passe (`supabase.auth.updateUser`), section « Zone irréversible » (suppression compte). Restyle, pas de changement fonctionnel.
- **D-06 (Dynamic Type)** : Support **avec plafonds** — `allowFontScaling` borné par `maxFontSizeMultiplier` (plafonds par rôle : serrés pour Display/serif, larges pour corps). Levier central = `AppText`.
- **D-07 (audit + sweep 9 écrans)** : (a) safe areas via `useSafeAreaInsets()` (jamais `SafeAreaView`), home indicator (`paddingBottom = insets.bottom`) ; (b) Dynamic Type plafonné ; (c) sweep tokens — corriger les espacements/tailles hors-échelle. Clair ET sombre. **Corriger les casses réelles ; ne pas réécrire ce qui est déjà cohérent.**

### Claude's Discretion
- Plafonds exacts `maxFontSizeMultiplier` par rôle → fixés dans UI-SPEC (1.15 / 1.25 / 1.3 / 1.8 / 1.2).
- Disposition précise des tuiles bento (grille, tailles) → fixée dans UI-SPEC (A pleine / B-C demi / D pleine).
- Liste précise des écrans du sweep → selon ce que l'audit révèle (voir Audit Baseline ci-dessous).

### Deferred Ideas (OUT OF SCOPE)
- Nouveau flux d'auth / social login / onboarding multi-slides — anti-features.
- Nouvelles métriques d'analyse au-delà de l'existant (+ nombre de moments).
- Pas de dégradés, pas de bento glassmorphism, pas de graphique multi-teintes, pas d'avatar rond, pas de gamification.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **UI-01** | Écrans d'auth (login + register) refondus selon l'archétype « page de couverture » | `login.tsx` et `register.tsx` lus intégralement ; flux/data à préserver identifiés (signInWithPassword, signUp+date_of_birth, stepper local `step` state, picker JJ/MM/AAAA, forgot-password) ; primitives `Button`/`Input` réutilisables ; ourlet mono + Cover 56 via `AppText display` |
| **UI-08** | Écran profil refondu selon l'archétype « page de couverture » | `profile/index.tsx` lu intégralement ; pattern avatar exact extrait (à préserver), calculs Analyse identifiés (screen-level useMemo), `points.length` = nombre de moments déjà disponible, wiring email/mdp/delete identifié et à conserver |
| **IOS-04** | 9 écrans respectent safe areas, home indicator, Dynamic Type sans casse de layout | Audit baseline complet ci-dessous : 0 `SafeAreaView`, tous en `useSafeAreaInsets`, gaps `insets.bottom` localisés (login/register), 0 `maxFontSizeMultiplier` hors `AppText`, valeurs hors-échelle et graisses hors-discipline cataloguées |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Rendu/restyle des écrans | Client (RN component) | — | Pure présentation ; aucune logique métier déplacée |
| Auth (login/register/email/mdp) | Backend (Supabase Auth) | Client (appel via `supabase.auth.*`) | Logique d'auth inchangée ; le client n'orchestre que l'appel + états réseau |
| Validation d'âge | Backend (trigger `handle_new_user`) | Client (garde UX step 1) | Gate réel côté serveur (règle 10) ; le client est défense-en-profondeur UX |
| Suppression de compte | Backend (Edge Function `delete-account`) | Client (Alert + invoke) | Logique de suppression côté serveur (RLS/service role) ; le client confirme + déclenche |
| Upload avatar | Client (require dynamique) → Supabase Storage | Backend (bucket `avatars` + RLS migration 012) | Le require dynamique est une contrainte runtime iOS ; le stockage/RLS est backend |
| Dérive Analyse (distribution/top mois/durée/nombre) | Client (screen-level `useMemo`) | Hook `usePoints` (source `points`) | Agrégations d'affichage dérivées de `points` déjà chargés — pas de nouvel appel réseau |
| Dynamic Type (plafonds) | Client (`AppText` primitive) | — | Levier typographique centralisé |

## Standard Stack

**Aucune nouvelle dépendance.** Cette phase n'installe rien. La stack est figée par CLAUDE.md et déjà en place.

### Core (déjà présent — aucune installation)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native + expo | SDK 54 | Framework mobile | Stack projet figée |
| expo-router | v6 | Navigation file-based | Groupes `(auth)` / `(app)/(tabs)` en place |
| @supabase/supabase-js | v2 | Auth + DB + Storage + Functions | `signInWithPassword`, `signUp`, `auth.updateUser`, `functions.invoke`, `storage` déjà câblés |
| react-native-safe-area-context | (Expo SDK 54) | `useSafeAreaInsets()` | Déjà utilisé sur les 9 écrans |
| react-native-paper | v5 | `Snackbar` uniquement | Erreurs réseau (D-01) |
| expo-image-picker | 17.0.11 | Avatar pick — **require dynamique only** | Crash si import statique (règles 14/15) ; version alignée SDK 54 (STAB-01) |
| expo-file-system/legacy | (SDK 54) | Lecture base64 avatar | API legacy requise SDK 54 (règle 17) |
| expo-haptics (via `lib/haptics`) | — | Retours haptiques | Helper `haptics.{tap,select,success,warn,error}` déjà en place (FOND-03) |

**Installation :** *N/A — aucune commande d'installation. Si `npx expo install --check` est lancé pendant la phase, ne PAS mettre à jour `expo-image-picker` au-delà de 17.0.11 sans validation device (régression STAB-01 historique).*

## Package Legitimacy Audit

> **Non applicable** — cette phase n'installe aucun package externe. Tous les modules utilisés sont déjà présents, validés device (builds #17/#18) et figés par CLAUDE.md. Aucun `npm install` / `expo install <new>` n'est attendu.

**Packages removed due to slopcheck [SLOP] verdict:** none (no installs)
**Packages flagged as suspicious [SUS]:** none (no installs)

## Architecture Patterns

### System Architecture Diagram

```
                         ┌──────────────────────────────────────────┐
   Réglages iOS          │   Composant écran (login/register/profile) │
   accessibilité ───────►│   const T = useTheme()                     │
   (Dynamic Type)        │   const styles = useMemo(()=>makeStyles(T),[T])
                         │   const insets = useSafeAreaInsets()       │
                         └───────────────┬──────────────────────────┘
                                         │ rend
                          ┌──────────────▼───────────────┐
                          │  <AppText variant=display|… >  │  ← plafonne le scale (D-06)
                          │  <Input> / <Button> / <PressableScale>
                          └──────────────┬───────────────┘
        actions utilisateur              │
   ─────────────────────────────────────┼────────────────────────────
   tap CTA  ─► haptics.tap()             │
   pick avatar ─► require('expo-image-picker') DANS la fonction (try/catch)
                  └─► launchImageLibraryAsync (PAS de requestMediaLibraryPermissions)
                       └─► require('expo-file-system/legacy') ─► base64
                            └─► supabase.storage.from('avatars').upload(...)
                                 └─► profiles.update({avatar_url}) ─► fetchProfile()
   submit login ─► supabase.auth.signInWithPassword ─► router.replace('/(app)/map')
   submit register(step2) ─► supabase.auth.signUp({…, data:{date_of_birth}})
                              └─► trigger serveur handle_new_user vérifie l'âge
   change email/pwd ─► supabase.auth.updateUser({email|password})
   delete account ─► Alert ─► supabase.functions.invoke('delete-account') ─► reset()+nav
   data Analyse ─► usePoints().points ─► useMemo (distribution/topMonths/totalMinutes/length)
```

### Component Responsibilities

| Fichier | Rôle | Action Phase 5 |
|---------|------|----------------|
| `app/(auth)/login.tsx` | Écran login | Refonte présentation (couverture). Préserver : `signInWithPassword`, `router.replace('/(app)/map')`, forgot-password, show/hide pwd. Migrer erreur inline → Snackbar (D-01). |
| `app/(auth)/register.tsx` | Écran register | Refonte présentation. Préserver : stepper local `step` 1/2, picker JJ/MM/AAAA, `confirmAge()`, `signUp` + `date_of_birth`, back buttons. **Corriger bug MIN_AGE (voir Pitfall 5).** |
| `app/(app)/(tabs)/profile/index.tsx` | Écran profil | Refonte présentation + bento Analyse. **Préserver `handlePickAvatar` mot pour mot.** Préserver email/mdp/delete/toggle. |
| `components/ui/AppText.tsx` | Primitive texte Dynamic Type | **Étendre** : ajouter variant `display` (`F.serifLight`, cap 1.15). |
| `components/ui/{Button,Input,PressableScale}` | Primitives | Réutiliser tel quel (voir tensions §Open Questions). |
| 6 autres écrans (map, point/new, point/[id], point/list, friends/index, friends/requests) | — | Audit + sweep ciblé IOS-04 (D-07). |

### Recommended Project Structure
*Aucune nouvelle structure.* Les fichiers existent aux chemins confirmés :
```
app/(auth)/login.tsx                      # UI-01
app/(auth)/register.tsx                   # UI-01
app/(app)/(tabs)/profile/index.tsx        # UI-08
app/(app)/(tabs)/map/index.tsx            # IOS-04 sweep
app/(app)/(tabs)/point/list.tsx          # IOS-04 sweep
app/(app)/(tabs)/friends/index.tsx       # IOS-04 sweep
app/(app)/(tabs)/friends/requests.tsx    # IOS-04 sweep
app/(app)/point/new.tsx                   # IOS-04 sweep (formSheet, hors tabs)
app/(app)/point/[id].tsx                  # IOS-04 sweep (formSheet, hors tabs)
components/ui/AppText.tsx                  # +variant display
```

### Pattern 1 : Theme + makeStyles + insets (canonique projet)
**What :** Tout écran recalcule ses styles via `useMemo([T])` et lit les insets.
**When to use :** Sur les 3 écrans refondus + tout écran touché par le sweep.
```tsx
// Source: pattern présent dans les 9 écrans (vérifié)
const insets = useSafeAreaInsets();
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
// container : { paddingTop: insets.top (+ 48 pour couverture solennelle) }
// scroll content : { paddingBottom: insets.bottom + 32 }   ← AJOUT IOS-04 sur login/register
```

### Pattern 2 : Avatar upload (require dynamique — À NE PAS RÉGRESSER)
**What :** L'unique pattern sûr pour `expo-image-picker` + `expo-file-system` sur iOS SDK 54.
**When to use :** Bloc avatar du profil — **copier verbatim, ne pas refactorer.**
```tsx
// Source: app/(app)/(tabs)/profile/index.tsx lignes 116-178 (VERIFIED: codebase)
async function handlePickAvatar() {
  let ImagePicker: typeof import('expo-image-picker');
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ImagePicker = require('expo-image-picker');           // ← require DANS la fonction
  } catch (e) { setSnackbar('Galerie indisponible : ' + (e instanceof Error ? e.message : String(e))); return; }

  let result: import('expo-image-picker').ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({   // ← PAS de requestMediaLibraryPermissionsAsync()
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
  } catch (e) { setSnackbar('Galerie : ' + (e instanceof Error ? e.message : String(e))); return; }
  if (result.canceled || !result.assets?.[0]) return;
  setUploadingAvatar(true);
  try {
    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${user!.id}.${ext}`;
    let FileSystem: typeof import('expo-file-system/legacy') | null = null;
    try { FileSystem = require('expo-file-system/legacy'); } catch { FileSystem = null; }   // ← legacy (règle 17)
    if (!FileSystem) { setSnackbar('Impossible de lire le fichier image.'); return; }
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: (FileSystem.EncodingType?.Base64 ?? 'base64') as 'base64',
    });
    // … atob → Uint8Array → supabase.storage.from('avatars').upload(...) → profiles.update({avatar_url}) → fetchProfile()
  } finally { setUploadingAvatar(false); }
}
```

### Pattern 3 : AppText `display` variant (seul ajout de composant)
**What :** Couvrir Cover 56 (hero couverture + grande tuile bento) avec un plafond serré.
```tsx
// Source: extension de components/ui/AppText.tsx (CITED: 05-UI-SPEC.md §Typography)
type Variant = 'display' | 'body' | 'title' | 'eyebrow';
const VARIANT_FONT: Record<Variant, string> = {
  display: F.serifLight,   // ← NOUVEAU (300, italic) — Cover 56
  body: F.sans, title: F.serif, eyebrow: F.mono,
};
const MAX_SCALE: Record<Variant, number> = {
  display: 1.15,           // ← NOUVEAU — hero unique, ne doit jamais déborder
  body: 2.0, title: 1.3, eyebrow: 1.2,
};
// AppText ne fixe PAS de fontSize/color (la taille/couleur viennent de `style`) — rester mince (D-06).
```
**Caps par instance (UI-SPEC) :** `title` à 1.25 sur Title 32 (override `maxFontSizeMultiplier={1.25}`) ; `body` baissé à 1.8 **par instance** sur les champs de couverture login/register (ne PAS baisser le défaut global 2.0).

### Pattern 4 : Dérive Analyse — « nombre de moments »
**What :** La grande tuile bento = `points.length`. **Aucun nouveau calcul, aucun nouvel appel réseau.**
```tsx
// Source: profile/index.tsx (VERIFIED: codebase) — points.length déjà affiché comme stat "Entrées" (l.336)
// Réutiliser les useMemo existants : noteDistribution (l.89), topMonths (l.97), totalMinutes (l.108).
// Grande tuile A : String(points.length)  ← déjà disponible, simplement re-présenté en Cover 56.
```

### Anti-Patterns to Avoid
- **Refactorer le bloc avatar** (le « nettoyer », extraire dans un hook, repasser en import statique) — cause directe de crashs #8/#11/#13. Verbatim only.
- **`requestMediaLibraryPermissionsAsync()`** — crash natif non catchable iOS 14+ (règle 14).
- **Réintroduire un `BlurView`** sur la tab bar (règle 13) — rester opaque.
- **Fixer des `height`/`width` sur conteneurs de texte** (sauf largeur ancre avatar 80px) — casse le Dynamic Type. Préférer `minHeight` + `flexWrap`.
- **Mettre le grand chiffre bento en rose** — il reste `T.text` (ancre par l'échelle, pas la couleur ; D-04).
- **Étendre la dette « appel Supabase direct hors hook »** de `requests.tsx`/`friends/index.tsx` pendant le sweep (documentée hors-périmètre — ne pas corriger ni propager).
- **Réécrire des écrans déjà cohérents** dans le sweep — corriger uniquement les casses listées.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Plafonner le Dynamic Type | Logique de scale custom par écran | `AppText` (variant + `maxFontSizeMultiplier`) | Source unique, déjà le levier validé (FOND-04/D-06) |
| Bouton CTA | Nouveau `TouchableOpacity` + styles ad hoc | `components/ui/Button` (variant `coral`/`solid`/`danger`) | Remplace les `updateBtn`/`deleteBtn` custom du profil (qui violent la discipline 2-graisses) |
| Champ underline | `TextInput` brut + ligne | `components/ui/Input` | Underline + label mono + error déjà standardisés |
| Feedback tap | Animation scale maison | `components/ui/PressableScale` | Spring transform déjà en place (perf compositor) |
| Retour haptique | `expo-haptics` appelé directement | `lib/haptics.{tap,select,success,warn,error}` | Mapping par intention, fire-and-forget (FOND-03) |
| Confirmation destructive | Modal custom | `Alert` natif iOS (style `destructive`) | Pattern projet (Phase 3/4) ; UI-SPEC §Destructive |
| Insets safe area | Constantes de hauteur hardcodées | `useSafeAreaInsets()` | Déjà la règle ; `paddingBottom: 100` hardcodés sont des cibles de sweep |

**Key insight :** Tout ce dont la phase a besoin existe déjà comme primitive ou helper. Le seul ajout justifié est le variant `display` d'`AppText`. Toute autre construction custom est une régression de discipline.

## Common Pitfalls

### Pitfall 1 : Régression de l'upload avatar
**What goes wrong :** L'écran « Moi » crashe au chargement ou au tap avatar.
**Why it happens :** Import statique d'`expo-image-picker`/`expo-file-system`, ou appel à `requestMediaLibraryPermissionsAsync()`, ou downgrade/upgrade de version hors 17.0.11.
**How to avoid :** Copier le bloc `handlePickAvatar` verbatim (Pattern 2). Ne pas toucher aux imports. Ne pas lancer `expo install` sur image-picker.
**Warning signs :** Tout `import * as ImagePicker` au niveau module ; tout `requestMediaLibraryPermissions` ; un `require('expo-file-system')` sans `/legacy`.

### Pitfall 2 : Dynamic Type qui casse la couverture
**What goes wrong :** Au plafond accessibilité iOS, le hero Cover 56 déborde / tronque, le formulaire passe sous la ligne de flottaison.
**Why it happens :** Aucun `maxFontSizeMultiplier` sur le texte (état actuel : seul `AppText` en a), ou hauteurs fixes sur conteneurs de texte.
**How to avoid :** Router le hero par `AppText variant="display"` (cap 1.15) ; champs de couverture cap 1.8 par instance ; tester à 1.0 ET au plafond.
**Warning signs :** `numberOfLines` absent sur le hero ; `height:` fixe sur un bloc titre.

### Pitfall 3 : Sur-extension du sweep IOS-04
**What goes wrong :** Le sweep devient une réécriture des 9 écrans, explose le scope, introduit des régressions.
**Why it happens :** Interprétation littérale de « plafonner tout le texte » et « aligner tous les espacements ».
**How to avoid :** D-07 dit explicitement « corriger les casses réelles ; ne pas réécrire ce qui est déjà cohérent ». Cadrer sur l'audit baseline. Sur les 6 écrans non-refondus, prioriser : `insets.bottom`, caps sur les heroes/gros serif, valeurs hors-échelle évidentes.
**Warning signs :** Diff massif sur un écran hors-périmètre de refonte ; modification d'une primitive partagée (`Button`/`Input`) « pour la cohérence » → blast radius app-wide.

### Pitfall 4 : Tension discipline 2-graisses vs primitives partagées
**What goes wrong :** Vouloir forcer {300,400} partout pousse à modifier `Button`/`Input` (qui utilisent `F.sansMedium`/`F.serif`), impactant les 9 écrans.
**Why it happens :** `Button.baseText` = `F.sansMedium` (l.110) ; `Input.input` = `F.serif` italic 20 (pas `F.sans` 16).
**How to avoid :** Appliquer la discipline au **texte éditorial nouveau ajouté au niveau écran**. Pour les champs de couverture, passer `style={{ fontFamily: F.sans, fontSize: 16 }}` à `Input` (le `style` est mergé dans le `TextInput`) au lieu de modifier la primitive. Laisser le `F.sansMedium` interne de `Button` (hors-périmètre — décision §Open Questions).
**Warning signs :** Édition de `components/ui/Button.tsx` ou `Input.tsx` non explicitement demandée.

### Pitfall 5 : `MIN_AGE` importé indéfini (bug latent côté client)
**What goes wrong :** Le check d'âge step 1 (`if (calcAge() < MIN_AGE)`) ne bloque jamais — `MIN_AGE` est `undefined`.
**Why it happens :** `register.tsx` fait `import { MIN_AGE } from '@/constants/config'` mais `config.ts` n'exporte que `APP_CONFIG.MIN_AGE` (nested) — **pas de bare `export const MIN_AGE`**. Donc `MIN_AGE === undefined` et `calcAge() < undefined === false` toujours.
**How to avoid :** Pendant le restyle de register step 1, corriger en `import { APP_CONFIG } from '@/constants/config'` + `APP_CONFIG.MIN_AGE`, **ou** ajouter `export const MIN_AGE = 18` à `config.ts`. Le gate serveur (`handle_new_user`) reste la vraie barrière (défense-en-profondeur intacte), mais le gate UX client doit fonctionner.
**Warning signs :** `< MIN_AGE` qui ne déclenche jamais `ageError` même avec une date < 18 ans.

### Pitfall 6 : Double contrôle de thème dans le profil
**What goes wrong :** Le profil a DEUX contrôles de thème — le bouton IcoSun/IcoMoon (header, l.327) ET un `Switch` « Mode sombre » (compte, l.416). UI-SPEC ne décrit que le toggle IcoSun/IcoMoon.
**How to avoid :** Le planner doit décider : consolider sur le toggle icône (recommandé, cohérent UI-SPEC §C) et retirer le `Switch`, OU garder les deux. Ajouter `accessibilityLabel` au toggle (checker_flag #2) + `haptics.select()`.

### Pitfall 7 : Simplification de la confirmation de suppression
**What goes wrong :** Le profil actuel exige de **taper « EFFACER »** dans un `Input` PUIS confirme via `Alert`. UI-SPEC §Destructive ne décrit qu'un `Alert` natif `[ Garder · Supprimer ]`.
**Why it matters :** Retirer le champ « EFFACER » est un changement de comportement (allègement de friction), pas un pur restyle.
**How to avoid :** Le planner doit trancher explicitement (suivre UI-SPEC = Alert seul, OU conserver le champ EFFACER). La logique d'invocation (`functions.invoke('delete-account')` + `reset()` + nav) reste inchangée dans les deux cas. `haptics.warn()` à l'ouverture, `haptics.error()` si échec.

## Runtime State Inventory

> **Non applicable** — cette phase ne renomme rien, ne migre aucune donnée, ne touche à aucune config de service runtime, secret, ou artefact de build. Refonte de présentation pure sur des écrans existants. Toutes les catégories : **None — vérifié** (aucun rename/refactor/migration dans le périmètre ; les migrations Supabase 009-012 sont déjà appliquées et hors-périmètre).

## IOS-04 — Audit Baseline (livrable de cadrage du sweep)

> Résultats grepés/lus sur les 9 écrans (HIGH confidence). Le sweep ne corrige QUE les casses réelles.

### Safe areas — DÉJÀ CONFORME
- **`SafeAreaView` : 0 occurrence** dans tout `app/` (VERIFIED: grep). Rien à retirer.
- **Tous les 9 écrans** utilisent `useSafeAreaInsets()` + `insets.top` (VERIFIED: grep). Axe safe-area-top = vérification, pas correction.

### Home indicator (`insets.bottom`) — casses localisées
| Écran | État actuel | Action |
|-------|-------------|--------|
| `point/new.tsx` | `paddingBottom: insets.bottom + 32` ✓ | OK |
| `point/[id].tsx` | `paddingBottom: insets.bottom + 32` ✓ | OK |
| `map/index.tsx` | FAB/hint en `insets.bottom + N` ✓ | OK |
| **`login.tsx`** | `paddingBottom: 48` **littéral** (plein écran, pas de tab bar) | **CORRIGER → `insets.bottom + 32`** |
| **`register.tsx`** | `paddingBottom: 48` **littéral** (plein écran) | **CORRIGER → `insets.bottom + 32`** |
| `profile/index.tsx` | `dangerBlock paddingBottom: 60` littéral (en tabs) | Aligner sur `insets.bottom + 32` (refonte) |
| `point/list.tsx` | `listContent paddingBottom: 100` (magic number clear tab bar) | Sweep bas-priorité (fonctionne ; magic number) |
| `friends/index.tsx` | `listContent paddingBottom: 100` | Sweep bas-priorité |
| `friends/requests.tsx` | `listContent paddingBottom: 100` | Sweep bas-priorité |

### Dynamic Type — `maxFontSizeMultiplier` absent partout sauf `AppText`
- **VERIFIED (grep) :** seul `components/ui/AppText.tsx` possède `maxFontSizeMultiplier`/`allowFontScaling`. **Aucun des 9 écrans** ne plafonne son texte brut.
- **Scope réaliste :** les 3 écrans refondus (login/register/profile) routent le texte éditorial par `AppText`. Les 6 écrans restants : caps ciblés sur les heroes / gros serif (layout-critiques), pas sur chaque `Text`.

### Graisses hors-discipline {300,400} — 3 cibles dans le périmètre
| Fichier | Ligne | Usage | Action |
|---------|-------|-------|--------|
| `register.tsx` | 354 | `F.sansLight` (subtitle step 1) | Refonte step 1 (probablement remplacé) |
| `profile/index.tsx` | 567 | `F.sansMedium` (`updateBtnText`) | Remplacer `updateBtn` custom par `<Button variant="coral">` |
| `profile/index.tsx` | 575 | `F.sansMedium` (`deleteBtnText`) | Remplacer `deleteBtn` custom par `<Button variant="danger">` |
| `components/ui/Button.tsx` | 110 | `F.sansMedium` (`baseText`) | **Hors-périmètre** (primitive partagée — ne pas toucher) |

### Valeurs hors-échelle (sweep ciblé — non exhaustif)
- `login.tsx` : `paddingHorizontal: 36`, `insets.top + 56`, `marginBottom: 44`, `fontSize: 48/17/13/14`, `marginVertical: 20`, `gap: 12`, `marginTop: 40`. (Largement réécrit par la refonte.)
- `register.tsx` : `paddingHorizontal: 36`, `fontSize: 64/42`, `gap: 14/10`, `marginLeft: 38`, divers `10/12/18/22`. (Réécrit par la refonte.)
- `profile/index.tsx` : `fontSize: 28/36/48/15/16/11`, `paddingTop: 24`, `paddingVertical: 20/14`, `gap: 12`, `paddingBottom: 60`. (Réécrit par la refonte.)
- Les 6 écrans hors-refonte : corriger uniquement les `13/14/18/20` de layout évidents si rencontrés ; ne pas réécrire.
- **`rowGap = 12` reste autorisé** (exception iOS intermediate documentée). Tout autre `12`/`14`/`18`/`20` hors-échelle → réaffecter à `8`/`16`/`24`/`32`.

### Thèmes — déjà conforme
- Tous les écrans en `makeStyles(T)` + `useMemo([T])`. Aucun hex en dur introduit ; tester dark+light (D-07).

## Code Examples

### CTA couverture (réutilise Button, ajoute haptique)
```tsx
// Source: composition des primitives existantes (CITED: 05-UI-SPEC.md §Connexion)
<Button variant="coral" loading={loading}
        onPress={() => { haptics.tap(); handleLogin(); }}>
  Se connecter
</Button>
```

### Champ de couverture (Input + override police + cap Dynamic Type)
```tsx
// Source: Input accepte `style` (mergé dans TextInput) et spread des props → maxFontSizeMultiplier passe (VERIFIED: Input.tsx)
<Input
  label="E-MAIL"
  value={email} onChangeText={setEmail}
  keyboardType="email-address" autoCapitalize="none"
  style={{ fontFamily: F.sans, fontSize: 16 }}   // override vers F.sans 16 (UI-SPEC)
  maxFontSizeMultiplier={1.8}                     // cap par instance (couverture compacte)
/>
```
**Caveat (MEDIUM) :** `Input` ne forwarde `maxFontSizeMultiplier` qu'au `TextInput` (via `{...props}`). Le **label** et l'**error** internes d'`Input` sont des `Text` bruts SANS cap. Si la couverture doit plafonner aussi label/error, le planner doit soit (a) migrer `Input` interne vers `AppText` (blast radius : tous les Input app-wide), soit (b) accepter que label mono 10px scale peu impactant. Recommandation : (b) — les labels mono 10px à 1.2 sont visuellement sûrs ; ne pas toucher la primitive.

### Bento — grande tuile « nombre de moments »
```tsx
// Source: points.length déjà disponible (VERIFIED: profile/index.tsx l.336)
<View style={styles.bentoTileLarge}>{/* fond T.surface, cardRadius 16 + borderCurve:'continuous' */}
  <AppText variant="display" style={{ fontSize: 56, lineHeight: 56, color: T.text }}>
    {String(points.length)}
  </AppText>
  <AppText variant="eyebrow" style={{ fontSize: 10, color: T.textFaint }}>PAGES DU CARNET</AppText>
</View>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `import * as ImagePicker` (statique) | `require('expo-image-picker')` dans la fonction | Builds #8→#14 | Évite crash natif onglet « Moi » |
| `expo-file-system` (`readAsStringAsync` à la racine) | `expo-file-system/legacy` | SDK 54 | `readAsStringAsync`/`EncodingType` migrés en legacy (règle 17) |
| `expo-image-picker@16.0.6` | `17.0.11` (aligné SDK 54) | Build #18 / STAB-01 | `expo install --check` doit valider ; ne pas dévier |
| Texte brut `<Text>` sans cap | `AppText` (cap par variant) | FOND-04 (Phase 1) | Levier Dynamic Type centralisé — à étendre Phase 5 |
| Formes carrées `borderRadius:0` | Échelle iOS arrondie + `borderCurve:'continuous'` | Pivot D-12 (Phase 2) | S'applique aux tuiles bento/CTA (≥ radiusSm) |

**Deprecated/outdated :**
- `requestMediaLibraryPermissionsAsync()` : interdit (crash iOS 14+). PHPickerViewController gère sa permission.
- `SafeAreaView` : interdit (règle projet) — déjà 0 occurrence.
- `BlurView` sur tab bar : interdit (règle 13).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `import { MIN_AGE }` dans register résout à `undefined` (config.ts n'exporte que `APP_CONFIG.MIN_AGE`) → check d'âge client inerte | Pitfall 5 | Si un bare export existe ailleurs (non trouvé au grep config.ts), le bug n'existe pas. Vérifier à l'exécution. Gate serveur intact dans tous les cas. |
| A2 | Aucun framework de test automatisé n'existe (validation = static gates + manuel) | Validation Architecture | Si un runner jest/vitest existe (non détecté), des tests unitaires deviendraient possibles. À reconfirmer si `package.json` change. |
| A3 | La grande tuile bento ne requiert aucun nouveau calcul (`points.length` suffit) | Pattern 4 | Si un dénombrement filtré était attendu (ex. moments visibles only), un `useMemo` léger serait à ajouter. UI-SPEC dit « nombre de moments » = count brut. |
| A4 | `Input` forwarde `maxFontSizeMultiplier` au `TextInput` via `{...props}` mais pas à label/error | Code Examples caveat | Vérifié par lecture d'`Input.tsx` ; risque faible. |

**Note :** Claims tagués `[VERIFIED: codebase]` ci-dessus = confirmés par lecture/grep du dépôt dans cette session. Les claims `[CITED: 05-UI-SPEC.md]` proviennent du contrat de design approuvé.

## Open Questions

1. **Faut-il arrondir la primitive `Button` (actuellement `borderRadius:0`) ?**
   - Ce qu'on sait : D-12 (Phase 2) a posé l'échelle iOS arrondie + `borderCurve:'continuous'` pour surfaces ≥ radiusSm ; UI-SPEC §Connexion décrit le CTA en `borderCurve:'continuous' radiusSm 12`. Mais `Button.tsx` est resté `borderRadius:0`.
   - Ce qui est flou : modifier `Button` impacte les 9 écrans (blast radius app-wide) — au-delà d'une « refonte de 3 écrans ».
   - Recommandation : **trancher au planning.** Option A (sûre) : appliquer le rayon via `style` sur les CTA des 3 écrans refondus uniquement (`style={{ borderRadius: T.radiusSm, borderCurve: 'continuous' }}`). Option B (cohérence globale, plus risquée) : arrondir la primitive — à valider device. Privilégier A pour rester dans le périmètre.

2. **Double contrôle de thème dans le profil (toggle icône + Switch).**
   - Recommandation : consolider sur le toggle IcoSun/IcoMoon (UI-SPEC §C), retirer le `Switch`. Ajouter `accessibilityLabel` (checker_flag) + `haptics.select()`.

3. **Confirmation de suppression : champ « EFFACER » + Alert (actuel) vs Alert seul (UI-SPEC).**
   - Recommandation : suivre UI-SPEC (Alert natif `[Garder · Supprimer]` seul) = restyle aligné ; documenter que le champ EFFACER est retiré (changement de friction assumé). Logique `functions.invoke('delete-account')` inchangée.

4. **Couverture du cap Dynamic Type sur label/error des `Input` de couverture.**
   - Recommandation : ne pas migrer la primitive ; les labels mono 10px à cap implicite sont visuellement sûrs. Plafonner uniquement la valeur du champ (forwardée) à 1.8.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| expo-image-picker | Avatar upload | ✓ | 17.0.11 (aligné SDK 54) | — (ne pas dévier) |
| expo-file-system/legacy | Lecture base64 avatar | ✓ | SDK 54 legacy | — |
| @supabase/supabase-js | auth/storage/functions | ✓ | v2 | — |
| Edge Function `delete-account` | Suppression compte | ✓ (invoquée dans le code actuel) | — | — (logique inchangée) |
| Bucket Storage `avatars` + RLS (migration 012) | Upload avatar | ✓ (appliqué Phase 1 STAB) | — | — |
| react-native-paper Snackbar | Erreurs réseau | ✓ | v5 | — |

**Missing dependencies with no fallback :** aucune.
**Missing dependencies with fallback :** aucune.

> Phase de présentation pure sur app existante — toutes les dépendances runtime sont déjà présentes et validées device (#18/#19/#26/#28).

## Validation Architecture

> `nyquist_validation` traité comme activé (clé non explicitement `false`). Cette phase est UI/finitions : **aucun framework de test automatisé n'existe** (A2). Validation = **gates statiques + checklist device manuelle** mappée aux REQ IDs.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | **Aucun runner JS** (pas de jest/vitest détecté). Gate statique = TypeScript (`tsc`). |
| Config file | `tsconfig.json` (strict) ; pas de config de test |
| Quick run command | `npx tsc --noEmit` (compter les erreurs ; baseline phase = **21**) |
| Full suite command | `npx tsc --noEmit` + checklist device manuelle (dark+light, Dynamic Type, safe areas) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01 | login/register refondus, flux intact (signIn/signUp/stepper/forgot) | manual-device + tsc | `npx tsc --noEmit` (0 nouvelle erreur) | gate statique ✓ |
| UI-01 | login/register : couverture sans casse à Dynamic Type max, dark+light | manual-device | — (checklist) | ❌ manuel |
| UI-08 | profil refondu, **avatar upload toujours OK (NON-régression)** | manual-device | — (checklist critique) | ❌ manuel |
| UI-08 | email/mdp change + delete compte fonctionnels après restyle | manual-device | — (checklist) | ❌ manuel |
| UI-08 | bento Analyse rendu correct (distribution/top mois/durée/nombre), empty state | manual-device | — (checklist) | ❌ manuel |
| IOS-04 | 9 écrans : safe areas + home indicator (pas de contenu sous le home indicator) | manual-device | — (checklist par écran) | ❌ manuel |
| IOS-04 | 9 écrans : Dynamic Type plafonné (1.0 ET max accessibilité) sans débordement | manual-device | — (checklist par écran) | ❌ manuel |
| IOS-04 | sweep tokens/graisses appliqué ; dark+light cohérents | manual-device + revue diff | — (revue) | ❌ manuel |

### Sampling Rate
- **Per task commit :** `npx tsc --noEmit` — comparer au baseline 21 (0 nouvelle erreur). Revue visuelle du diff (pas de hex/`fontFamily` en dur introduit).
- **Per wave merge :** `npx tsc --noEmit` complet + smoke device sur les écrans touchés (dark+light).
- **Phase gate :** Build EAS natif iOS → TestFlight → checklist device complète AVANT `/gsd:verify-work`. Particulièrement : **avatar upload (non-régression)** + Dynamic Type max + home indicator sur les 9 écrans.

### Wave 0 Gaps
- [ ] **Aucun fichier de test à créer** — pas d'infra de test, par décision projet (validation device). Ne PAS introduire jest/vitest (hors-périmètre, scope creep).
- [ ] Checklist device manuelle à formaliser dans le plan (par écran × dark/light × Dynamic Type {1.0, max}).
- [ ] Confirmer baseline `tsc` = 21 au démarrage de la phase (référence pour « 0 nouvelle erreur »).

*(Pas de framework d'automatisation : la validation comportementale repose sur la checklist TestFlight, conforme à l'historique du milestone — builds #17→#28.)*

## Security Domain

> `security_enforcement` traité comme activé. Phase = **restyle only** : aucune nouvelle logique d'auth, aucun nouvel endpoint. Les contrôles existants doivent être **préservés sans régression**.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control (existant — à préserver) |
|---------------|---------|-------------------------------------------|
| V2 Authentication | yes | `supabase.auth.signInWithPassword` / `signUp` / `updateUser` — inchangés. Restyle ne touche pas le flux. |
| V3 Session Management | no | Géré par Supabase ; hors-périmètre. |
| V4 Access Control | yes | RLS Supabase (vérif `creator_id`, consentement `is_visible` via trigger) — **ne jamais contourner** (CLAUDE.md sécurité). Aucune modif RLS dans cette phase. |
| V5 Input Validation | yes | Validation email/pwd côté client (regex, longueur ≥ 8) existante dans login/register/profile — préserver. Âge ≥ 18 : gate serveur `handle_new_user` (réel) + UX client (corriger bug MIN_AGE, Pitfall 5). |
| V6 Cryptography | no | Aucune crypto custom ; auth déléguée à Supabase. |

### Known Threat Patterns for {RN/Expo + Supabase}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Bypass du gate d'âge client | Elevation of Privilege | Gate serveur `handle_new_user` (règle 10) — reste la vraie barrière ; corriger aussi le gate UX (MIN_AGE) |
| Suppression de compte non confirmée | Repudiation/Tampering | `Alert` natif destructive + Edge Function `delete-account` (service role côté serveur) — logique inchangée |
| Fuite `date_of_birth`/`push_token` | Information Disclosure | RLS + `search_users` exclut ces champs — **ne pas exposer** dans le restyle profil (CLAUDE.md sécurité §3) |
| Service Role Key côté client | Elevation of Privilege | Interdit (CLAUDE.md §1) — aucun appel service role dans le restyle |
| Erreurs réseau qui fuient des détails | Information Disclosure | Snackbar avec copie générique FR (« Connexion impossible… ») — ne pas afficher de stack/détails Supabase bruts en UI |

**Contrainte de non-régression sécurité :** la refonte est cosmétique ; **aucune** policy RLS, aucun trigger, aucun appel auth ne doit changer de comportement. Seule correction sécurité-adjacente autorisée : le bug MIN_AGE (renforce le gate UX, ne l'affaiblit pas).

## Sources

### Primary (HIGH confidence)
- Codebase LoveMap (lu/grepé cette session) : `login.tsx`, `register.tsx`, `profile/index.tsx`, `AppText.tsx`, `Input.tsx`, `Button.tsx`, `theme.ts`, `fonts.ts`, `config.ts`, `lib/haptics.ts` ; greps `SafeAreaView`/`insets.bottom`/`maxFontSizeMultiplier`/`MIN_AGE`/graisses ; glob des 9 écrans.
- `05-CONTEXT.md` (décisions verrouillées D-01…D-07).
- `05-UI-SPEC.md` (contrat de design approuvé — plafonds, bento, copywriting, destructive).
- `CLAUDE.md` (règles 10/13/14/15/17, identité visuelle T.*/F.*, sécurité).

### Secondary (MEDIUM confidence)
- `REQUIREMENTS.md` (UI-01/UI-08/IOS-04), `STATE.md` (historique builds #17→#28, baseline tsc 21), `FEATURES.md` (archétypes couverture, anti-features).

### Tertiary (LOW confidence)
- Aucune — la phase ne dépend d'aucune source web (pure refonte d'app existante).

## Metadata

**Confidence breakdown :**
- Standard stack : HIGH — aucune dépendance nouvelle, tout vérifié dans le dépôt.
- Architecture / patterns : HIGH — code source lu intégralement ; pattern avatar extrait verbatim.
- IOS-04 audit : HIGH — résultats grepés (0 SafeAreaView, gaps insets.bottom et caps localisés précisément).
- Pitfalls : HIGH — issus de l'historique projet (crashs #8-#14) et de la lecture directe (bug MIN_AGE).
- Validation : HIGH — absence de framework test confirmée ; modèle static-gate + device conforme au milestone.

**Research date :** 2026-06-02
**Valid until :** ~2026-07-02 (stable — app existante, SDK figé ; re-vérifier si SDK/Expo upgrade ou si `package.json` change).

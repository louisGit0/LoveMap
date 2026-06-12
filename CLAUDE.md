# CLAUDE.md — Contexte persistant LoveMap

## INSTRUCTION PRIORITAIRE POUR CLAUDE CODE

**Ce fichier est la mémoire vivante du projet. Tu dois :**

1. **Le lire en entier au début de chaque session** — sans exception, avant d'écrire la moindre ligne de code
2. **Le mettre à jour immédiatement** après chaque modification significative du projet
3. **Le commiter avec chaque push** — il fait partie intégrante du code

**Ce fichier doit toujours refléter l'état réel du projet.** Si une information est fausse ou obsolète, la corriger ou la supprimer. Ne jamais laisser une information périmée.

**Quand le mettre à jour :**
- Après avoir complété une phase ou une feature → mettre à jour le tableau des phases et l'architecture
- Quand Louis donne la même consigne plus d'une fois → l'intégrer dans les règles obligatoires
- Quand un fichier est créé, renommé ou supprimé → mettre à jour l'arborescence
- Quand une dépendance change → mettre à jour la stack
- Quand une règle n'est plus valide → la supprimer immédiatement

---

---

## Identité du projet

**Nom** : LoveMap  
**Type** : Application mobile React Native (Expo) destinée aux adultes  
**Dépôt GitHub** : https://github.com/louisGit0/LoveMap (branche locale : `master` → `origin/master`. ⚠️ La branche `main` du remote est une vieille ligne morte divergente — NE JAMAIS y pousser ; toujours `git push origin master`)  
**Propriétaire** : Louis (louisGit0)

**Concept** : LoveMap permet à des utilisateurs adultes de poser des points géolocalisés sur les lieux où ils ont eu un rapport sexuel, de les annoter (note /10, commentaire, durée), de les visualiser sous forme de heatmap, et de les partager uniquement avec des amis approuvés via un système de consentement double.

---

## Workflow obligatoire après CHAQUE modification

**Sans exception, dans cet ordre :**

```bash
# 1. Commit et push sur GitHub (branche locale master → origin/master)
git add .
git commit -m "feat/fix/chore: description courte de la modification"
git push origin master

# 2. Mise à jour EAS (Over-The-Air update)
eas update --branch main --message "description courte de la modification"
```

> Si l'une de ces deux étapes échoue, le signaler à Louis immédiatement avec le message d'erreur exact. Ne pas considérer la tâche comme terminée tant que les deux n'ont pas réussi.

---

## Stack technique (ne pas dévier)

| Outil | Version | Usage |
|-------|---------|-------|
| React Native + Expo SDK | 54 | Framework mobile |
| TypeScript | strict | Langage (pas de `any` sans justification) |
| Expo Router | v6 (file-based) | Navigation |
| Supabase JS | v2 | Backend, Auth, DB, Realtime |
| @rnmapbox/maps | 10.3.1 | Carte interactive Mapbox (mobile uniquement) |
| Zustand | v4 | State management |
| React Native Paper | v5 | Composants UI (usage réduit — UI principale via theme.ts) |
| expo-location | ~19.0.8 | Géolocalisation |
| expo-notifications | ~0.32.16 | Push notifications |
| expo-blur | latest | Tab bar translucent BlurView |
| expo-haptics | latest | Retour haptique sur actions clés |
| react-dom + react-native-web | 19.1.0 / ^0.21.0 | Support web Expo |

---

## Architecture du projet

```
lovemap/
├── app/                          # Expo Router — routing file-based
│   ├── _layout.tsx               # Root layout (PaperProvider + auth listener)
│   ├── index.tsx                 # Redirect : login → map (plus d'age-gate au démarrage)
│   ├── (auth)/                   # Routes non protégées
│   │   ├── login.tsx             # Connexion — design Bold
│   │   └── register.tsx          # Inscription 2 étapes : âge (step 1) + formulaire (step 2)
│   └── (app)/                    # Routes protégées (session requise)
│       ├── _layout.tsx           # Bottom tab navigator (Carte, Cercle, Profil)
│       ├── map/index.tsx         # Carte principale + FAB
│       ├── point/new.tsx         # Création d'un point
│       ├── point/[id].tsx        # Détail / consentement partenaire
│       ├── point/list.tsx        # Liste chronologique des moments
│       ├── friends/index.tsx     # "Cercle" — liste amis + recherche
│       ├── friends/requests.tsx  # Demandes d'amitié
│       └── profile/index.tsx     # Profil « page de couverture » : avatar carré + bento Analyse (P5) + toggle thème unique + email/mdp + suppression (Alert seule)
├── components/
│   ├── map/
│   │   ├── AppMapView.tsx        # Carte mobile (@rnmapbox/maps — MapboxGL.MapView + Camera)
│   │   ├── AppMapView.web.tsx    # Placeholder web
│   │   ├── PointMarker.tsx       # Pin « sceau » — MapboxGL.MarkerView + <Seal> (note gravée serif, pastille N) + Pressable (règle 20)
│   │   ├── PointMarker.web.tsx   # Stub web (null)
│   │   ├── UserLocationMarker.tsx # Relevé « point blanc » pulsant (MarkerView + Animated, reduce-motion) — remplace le point bleu système
│   │   ├── HeatmapLayer.tsx      # Heatmap mobile (MapboxGL.ShapeSource + HeatmapLayer)
│   │   ├── HeatmapLayer.web.tsx  # Stub web (null)
│   │   ├── MapHeader.tsx         # Toggle pins/heatmap
│   │   └── FriendSelector.tsx    # Sélecteur d'ami pour filtre carte
│   ├── point/                    # PointForm, PointListItem (archétype table des matières), PhotoPicker (FiltersBottomSheet supprimé P4 — filtres inline dans list.tsx)
│   ├── friends/                  # FriendItem, FriendRequestItem
│   └── ui/
│       ├── Button.tsx            # Pill button custom (primary/ghost)
│       ├── Input.tsx             # Input avec tokens Bold
│       ├── SkeletonItem.tsx      # Skeleton loader animé (SkeletonItem + SkeletonRow)
│       ├── PressableScale.tsx    # Animated.spring scale on press (remplace TouchableOpacity)
│       └── PageHeader.tsx        # Header réutilisable (eyebrow + titre + back + slot droit)
├── constants/
│   ├── config.ts                 # MIN_AGE, APP_NAME, MAPBOX_STYLE, COLORS (palette fixe)
│   ├── markers.ts                # noteHue(n) — teinte du sceau selon la note (10–7 vif / 6–4 doux / 3–1 profond)
│   ├── fonts.ts                  # Familles typographiques (objet F)
│   └── theme.ts                  # Design tokens (T.bg, T.primary, T.pill…)
├── lib/
│   ├── supabase.ts               # Client Supabase initialisé + typé
│   ├── notifications.ts          # Helpers Expo Push
│   ├── react-native-maps.web.js  # Stub react-native-maps pour web (conservé pour metro compat)
│   └── rnmapbox-maps.web.js      # Stub @rnmapbox/maps pour web
├── metro.config.js               # Alias react-native-maps + @rnmapbox/maps → stubs sur platform=web
├── stores/                       # Zustand
│   ├── authStore.ts              # session, user, profile (ageVerified supprimé — géré dans register.tsx)
│   ├── mapStore.ts               # points, viewMode (pins/heatmap)
│   ├── friendStore.ts            # friends, pendingReceived, pendingSent
│   └── themeStore.ts             # isDark, toggleTheme
├── hooks/
│   ├── useAuth.ts                # fetchProfile, signOut
│   ├── usePoints.ts              # CRUD points + conversion PostGIS→MapPoint
│   ├── useFriends.ts             # CRUD amitiés + demandes (unfriend, respondToRequest, respondToTag — consentement taguage inline P4)
│   └── useTheme.ts               # retourne darkTheme ou lightTheme selon store
├── types/
│   ├── database.types.ts         # Types générés Supabase
│   └── app.types.ts              # Types métier (MapPoint, FriendWithProfile…)
├── supabase/migrations/
│   ├── 001_initial_schema.sql    # Schéma complet + RLS
│   ├── 002_partner_edit.sql
│   ├── 003_point_photos.sql
│   ├── 004_point_address.sql
│   ├── 005_age_check_trigger.sql # Trigger âge ≥ 18 côté serveur
│   ├── 006_profiles_pending_rls.sql # profiles_select élargi à status IN ('pending','accepted')
│   ├── 007→012                   # RPC create_point, colonnes, RLS visibilité/récursion, storage avatars
│   ├── 013_push_notifications.sql # pg_net + triggers notifs serveur (réponse mention, ami a posté)
│   ├── 014_moderation_blocks_reports.sql # user_blocks + content_reports + trigger anti-amitié bloquée (Guideline 1.2)
│   └── 015_get_blocked_users.sql # RPC SECURITY DEFINER : liste les comptes bloqués (profil hors RLS) pour la section « Bloqués »
├── docs/                         # Pages légales hébergées via GitHub Pages (master /docs) : privacy.html, terms.html, index.html
├── store/                        # Kit de soumission App Store (app-store-listing.md)
└── CLAUDE.md                     # Ce fichier — à consulter et maintenir
```

---

## Base de données Supabase

**URL du projet** : dans `.env.local` → `EXPO_PUBLIC_SUPABASE_URL`

### Tables

| Table | Colonnes clés | Notes |
|-------|--------------|-------|
| `profiles` | id, username, display_name, date_of_birth, push_token | Liée 1:1 à auth.users via trigger |
| `points` | id, creator_id, location (GEOMETRY), note 1-10, comment, duration_minutes, is_visible | is_visible=FALSE par défaut |
| `point_partners` | point_id, partner_id, status (pending/accepted/rejected) | Consentement du partenaire tagué |
| `friendships` | requester_id, addressee_id, status (pending/accepted/rejected/blocked) | Relation bidirectionnelle |

### Fonctions SQL exposées

| Fonction | Signature | Retour | Usage |
|----------|-----------|--------|-------|
| `create_point` | `(p_creator_id, p_longitude, p_latitude, p_note, p_comment?, p_duration_minutes?, p_happened_at?, p_address?)` | `UUID` | Crée un point avec PostGIS `ST_MakePoint` côté serveur — appelée via `supabase.rpc('create_point', {...})` |
| `search_users` | `(query TEXT)` | `SETOF profiles` | Recherche d'utilisateurs — exclut `date_of_birth` et `push_token` |
| `send_expo_push` | `(tokens text[], title, body, data jsonb)` | `void` | Helper notif — POST multicast vers `exp.host` via `pg_net` (`net.http_post`). `SECURITY DEFINER`, `exception when others` |

### Notifications push (migration 013)

Trois événements notifient via l'API Expo Push (`exp.host`). L'app enregistre le `push_token` (`lib/notifications.ts`) et affiche les notifs entrantes (`app/_layout.tsx`).

| Événement | Déclencheur | Destinataire | Implémentation |
|-----------|-------------|--------------|----------------|
| Mention reçue | création de point avec partenaires | personne mentionnée | **CLIENT** — `createPoint` (`usePoints.ts`) lit le `push_token` des partenaires (amis → RLS OK) et POST exp.host |
| Réponse à une mention | `point_partners` UPDATE → status accepted/rejected | **créateur** du point | **SERVEUR** — trigger `trg_notify_mention_response` |
| Ami a posté un moment | `points` UPDATE → `is_visible` FALSE→TRUE (moment validé) | **amis acceptés** du créateur (hors partenaires) | **SERVEUR** — trigger `trg_notify_friends_new_point` |

- Triggers serveur en `SECURITY DEFINER` (lisent les `push_token` hors RLS, sans jamais les exposer aux clients) et **encapsulés dans `exception when others`** → une notif ratée ne casse JAMAIS la mutation déclenchante (consentement / visibilité).
- Événement 1 **reste client-side** (déjà dans le binaire) pour éviter le doublon. ⚠️ Ne PAS ajouter de trigger `point_partners` INSERT sans d'abord retirer le push client de `createPoint`.
- Événement 3 se déclenche à la **bascule de visibilité** (pas à la création brute) : les amis sont prévenus pile quand le moment apparaît sur leur carte. Cohérent avec « un moment n'apparaît qu'une fois validé ».

### Modération (migration 014 — App Store Guideline 1.2)

Exigences Apple pour le contenu généré par les utilisateurs (mention/taguage d'autrui) : signaler, bloquer, EULA.

| Action | Surface UI | Donnée | Hook |
|--------|-----------|--------|------|
| Signaler un moment | détail d'un moment d'un autre → « Signaler ce moment » | `content_reports` (reported_point_id + reported_user_id) | `useFriends.reportContent` |
| Signaler un utilisateur | onglet Amis → appui long sur un contact → « Signaler » | `content_reports` (reported_user_id) | `useFriends.reportContent` |
| Bloquer un utilisateur | détail moment → « Bloquer l'auteur » · Amis → appui long → « Bloquer » | `user_blocks` + suppression amitié | `useFriends.blockUser` |
| EULA / confidentialité | écran « Moi » → liens (`LINKS` dans `config.ts`) → `docs/*.html` | — | — |
| Voir / débloquer | onglet Amis → section « Comptes bloqués » (footer, visible si ≥1) → « Débloquer » | RPC `get_blocked_users` + delete `user_blocks` | `useFriends.fetchBlockedUsers/unblockUser` |

- `content_reports` : INSERT client seul (RLS), lecture **admin via service role** uniquement.
- `blockUser` : insère le blocage + supprime l'amitié (invisibilité mutuelle via RLS) + retire du store. Trigger serveur `prevent_blocked_friendship` empêche de (re)créer une amitié entre bloqués.
- `user_blocks` / `content_reports` ne sont **pas dans `database.types.ts`** → accès via `(supabase as any).from(...)` (exception « Supabase brut »).

### Règles métier critiques

- `is_visible` passe à `TRUE` **uniquement** via le trigger SQL `on_partner_consent` — ne jamais le modifier côté client directement
- Un point sans partenaire tagué reste `is_visible = FALSE` — visible uniquement par son créateur via RLS
- RLS est actif sur toutes les tables — ne jamais utiliser la service key côté client
- **La création de point utilise exclusivement la RPC `create_point`** — ne jamais faire d'insert direct sur `points` depuis le client
- **La carte MAP s'affiche toujours**, sans condition sur le nombre de points — un hint non-bloquant s'affiche si aucun point

---

## Règles de code obligatoires

1. **TypeScript strict** — pas de `any` sauf retours Supabase bruts (à typer immédiatement)
2. **Gestion d'état réseau** — chaque composant faisant un appel réseau gère 3 états : loading / success / error
3. **Erreurs utilisateur** — afficher via Snackbar React Native Paper, pas uniquement en console
4. **Pas d'appels Supabase dans les composants** — tout passe par les hooks (`useAuth`, `usePoints`, `useFriends`)
5. **Pas de logique métier dans les composants UI** — uniquement dans les hooks ou stores
6. **Tous les textes de l'interface sont en français**
7. **Partenaire obligatoire sur un point** — `handleSubmit` dans `point/new.tsx` bloque si aucun partenaire n'est sélectionné ; le CTA est désactivé si `friends.length === 0`
8. **`happened_at` saisi par l'utilisateur** — ne jamais utiliser `new Date()` pour `happened_at` ; la date est saisie via les champs JJ/MM/AAAA dans `point/new.tsx`
9. **Secrets Supabase via EAS secrets uniquement** — ne jamais hardcoder `EXPO_PUBLIC_SUPABASE_URL` ou `EXPO_PUBLIC_SUPABASE_ANON_KEY` dans `eas.json`. Utiliser `eas secret:create --scope project --name ... --value ...` (à faire une seule fois avant chaque build production)
10. **Age gate : intégré dans register.tsx uniquement** — la vérification d'âge est la première étape du formulaire d'inscription (step 1). La validation côté serveur reste active via le trigger `handle_new_user()` dans `supabase/migrations/005_age_check_trigger.sql`. Il n'existe plus d'écran `age-gate.tsx` séparé, et `index.tsx` ne contient plus de garde `ageVerified`.
11. **Ordre des gardes dans `index.tsx`** — uniquement : `isLoading` → `!session` → redirect map. Simple et sans état d'age gate.
12. **Création de point via RPC uniquement** — ne jamais insérer directement dans `points` avec un WKT géométrique côté client. Toujours utiliser `supabase.rpc('create_point', { p_longitude, p_latitude, ... })` — la fonction SQL gère `ST_SetSRID(ST_MakePoint(...), 4326)` côté serveur.
13. **Tab bar : fond opaque** — ne jamais remettre un `BlurView` sur la tab bar. Utiliser `backgroundColor: isDark ? '#111114' : '#f2f2f7'` dans `makeStyles`. La lisibilité prime.
14. **`requestMediaLibraryPermissionsAsync()` interdit** — NE JAMAIS appeler cette fonction. Sur iOS 14+, `launchImageLibraryAsync()` utilise PHPickerViewController qui gère sa propre autorisation. Appeler `requestMediaLibraryPermissionsAsync()` déclenche un crash natif iOS non catchable. Appeler `launchImageLibraryAsync()` directement dans un try/catch.
15. **`expo-image-picker` et `expo-file-system` : require dynamique OBLIGATOIRE à l'intérieur de la fonction** — Ces deux modules crashent l'écran "Moi" si importés statiquement OU via require au niveau module. Le seul pattern sûr est :
```typescript
async function handlePickAvatar() {
  let ImagePicker: typeof import('expo-image-picker');
  try { ImagePicker = require('expo-image-picker'); } catch (e) { setSnackbar('Galerie : ' + e); return; }
  // ...
  let FileSystem: typeof import('expo-file-system') | null = null;
  try { FileSystem = require('expo-file-system'); } catch { FileSystem = null; }
}
```
Ne jamais écrire `import * as ImagePicker from 'expo-image-picker'` ni `import * as FileSystem from 'expo-file-system'` — confirmé par builds #8, #11, #13 : la static import crashe l'onglet "Moi" sans message d'erreur.

16. **Aligner les paquets natifs Expo sur la version du SDK — vérifier avec `npx expo install --check`** — Un paquet natif épinglé à une version d'un SDK antérieur provoque un mismatch d'interface JS↔natif qui fait crasher la fonctionnalité dans un build natif (invisible en JS/OTA). Confirmé build #17 : `expo-image-picker@16.0.6` sous SDK 54 (qui attend `17.0.11`) → `launchImageLibraryAsync` rejette (« Impossible d'ouvrir la galerie ») puis crash, présent depuis #15. Toujours installer les modules natifs via `npx expo install <pkg>` (jamais `npm install <pkg>@x`) et lancer `npx expo install --check` avant chaque build de production. Cause racine STAB-01.

17. **SDK 54 : API fichier legacy** — `expo-file-system` a déplacé `readAsStringAsync` et `EncodingType` vers `expo-file-system/legacy` en SDK 54 ; l'import principal ne les expose plus. Pour lire un fichier en base64 (upload avatar), importer depuis `expo-file-system/legacy`.

18. **RLS Supabase : pas de récursion croisée entre policies** — Une policy SELECT sur `points` qui sous-requête `point_partners` ⟷ une policy SELECT sur `point_partners` qui sous-requête `points` = récursion infinie PostgreSQL `42P17`. Pour une vérification cross-table dans une policy, utiliser une fonction `SECURITY DEFINER` (avec `SET search_path`, EXECUTE limité à `authenticated`) qui contourne la RLS de la table interrogée. Cf. migration 011 (`is_pending_partner`). Cause racine STAB-02/03.

19. **iOS 26 : `presentation: 'formSheet'` est cassé — utiliser `presentation: 'modal'`** — Avec **react-native-screens 4.16** (SDK 54) sur **iOS 26**, un `formSheet` (détents custom) **ancre son contenu en bas / rend trop petit** (RNS [#3235](https://github.com/software-mansion/react-native-screens/issues/3235) + [#2522](https://github.com/software-mansion/react-native-screens/issues/2522)) → l'écran apparaît **noir en haut** (et entièrement noir clavier ouvert). **Non corrigé** jusqu'à 4.20+ (fixes form sheet récents = Android only) et **non corrigeable en layout JS** (une taille explicite `useWindowDimensions` empire le bug → contenu hors écran, confirmé build #25). **Toujours** présenter les écrans glissants du bas (création/détail point) en **`presentation: 'modal'`** (carte pageSheet native : glisse du bas, `gestureEnabled` swipe-to-dismiss, `usePreventRemove` OK) — **jamais** `formSheet`/`sheetAllowedDetents`. Confirmé build #26 (validé device). Corollaire carte : dans le `formSheet` cassé, tout était noir (bug du sheet). Dans un **`modal`**, une **`<Image>` statique Mapbox** (Static Images API, `mapboxStaticUrl()` dans `constants/config.ts`, pin rose dessiné en RN) **s'affiche correctement** — c'est l'aperçu carte du détail/création (validé build #27). Un **MapView GL** reste risqué (surface Metal) → préférer l'image statique pour un simple aperçu.

20. **PointAnnotation ne rend PAS de `<Text>` à police custom — utiliser `MarkerView` pour tout marqueur riche** — `MapboxGL.PointAnnotation` prend un *snapshot natif* de son contenu RN, qui **ne rasterise pas correctement un `<Text>` avec une police custom** (Cormorant) : le marqueur apparaît en **fantôme / cercle gris transparent** (et un overlay translucide en `position:absolute` se compose par-dessus le fond plein). **Même cause que la pastille de compte vide au build #30.** L'ancien pin marchait justement parce qu'il n'avait **aucun texte**. → **Tout marqueur contenant du texte (la note gravée du sceau, la pastille N) DOIT être rendu via `MapboxGL.MarkerView`** (vues RN *live*, pas de snapshot) — comme le relevé blanc. Mettre **`allowOverlap`** sur la MarkerView (sinon Mapbox masque les marqueurs qui se chevauchent → cause du switch MarkerView→PointAnnotation au #16) et gérer le tap via un **`<Pressable>`** standard (fini les quirks `onSelected` de PointAnnotation : triple-ouverture, halo collé). Réserver PointAnnotation aux marqueurs **sans texte**. Confirmé : #33 (KO en PointAnnotation, sceaux invisibles) → **#34 (OK en MarkerView, validé device)**.

21. **Avatar : cache-busting OBLIGATOIRE sur l'URL** — l'avatar est uploadé sur un chemin **fixe** (`{userId}.ext`, `upsert:true`) → l'URL publique Supabase est **identique** à chaque upload. Sans paramètre unique, `<Image>` RN ré-affiche l'**ancienne** image depuis son cache (symptôme : « Portrait mis à jour » mais la photo ne change pas, signalé #35). Toujours stocker `avatar_url = publicUrl + '?v=' + Date.now()` dans `profiles`. Fix dans `profile/index.tsx` → `handlePickAvatar`.

22. **Lancement robuste — ne JAMAIS figer le splash + error boundary global obligatoire** — Refus Apple **Guideline 2.1a « App unresponsive on launch »** (testé sur iPad Air M3 / iPadOS 26.5, build 36). **(a) `supportsTablet` doit rester `false`** dans `app.json` (`ios.supportsTablet`) — l'app est iPhone-only ; ne jamais le repasser à `true` ni ajouter `deviceFamily: ['iphone','ipad']`. ⚠️ Apple teste quand même une app iPhone-only sur iPad en mode compatibilité → le flag n'est PAS le correctif du freeze. **(b) Cause racine probable du freeze : `useFonts` qui hangue.** Le gate de splash dans `app/_layout.tsx` **doit** être `if (!fontsLoaded && !fontError)` — jamais `if (!fontsLoaded)` seul : si une police Google échoue à charger sur le device, `fontsLoaded` reste `false` à vie → spinner infini → Apple voit une app figée. Toujours destructurer `const [fontsLoaded, fontError] = useFonts({...})` et rendre l'app (polices système en fallback) dès qu'une erreur survient. **(c) Error boundary global** : `app/_layout.tsx` est toujours wrappé dans `<AppErrorBoundary>` (`components/ui/AppErrorBoundary.tsx`) — placé **autour** de `GestureHandlerRootView` (ne jamais retirer le GestureHandlerRootView racine, règle FOND). Le fallback est volontairement autonome (couleurs codées en dur `#000`/`#ff2d87`, police système) : il ne dépend ni du thème ni des polices, justement ce qui peut avoir planté. **NB :** le `bundleIdentifier` est `com.louissoudy.lovemap` (PAS `com.lovemap.app`) — ne jamais le modifier. Second motif de refus (build 36) = **« Placeholder text in the name »**, métadonnées App Store Connect à corriger **manuellement** (Name/Subtitle/Description/Keywords/Privacy URL) — hors code.

---

## Identité visuelle — Design Éditorial Noir/Rose + Light Mode

Les tokens sont dans `constants/theme.ts` (`darkTheme` / `lightTheme`). **Ne pas hardcoder de couleurs.**
Les familles de polices sont dans `constants/fonts.ts` (objet `F`). **Ne pas hardcoder de fontFamily.**

**Système de thème** : `useTheme()` retourne le thème actif. Chaque composant utilise le pattern :
```tsx
const T = useTheme();
const styles = useMemo(() => makeStyles(T), [T]);
```
Le toggle dark/light est dans `app/(app)/profile/index.tsx` via `useThemeStore` (switch IcoSun/IcoMoon). `settings.tsx` **n'existe plus** — tout est fusionné dans `profile/index.tsx`.

| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| `T.bg` | `#000000` | `#ffffff` | Fond global |
| `T.surface` | `#0a0a0a` | `#f7f7f7` | Surface / cards |
| `T.surface2` | `#141414` | `#efefef` | Surface secondaire |
| `T.border` | `#1f1f1f` | `#e2e2e2` | Bordures |
| `T.text` | `#ffffff` | `#0a0a0a` | Texte principal |
| `T.textDim` | `#d9d9d9` | `#2a2a2a` | Texte secondaire |
| `T.textFaint` | `#8a8a8a` | `#7a7a7a` | Texte tertiaire / inactif |
| `T.primary` | `#ff2d87` | `#ff2d87` | Accent rose (identique) |
| `T.danger` | `#a91860` | `#c41960` | Danger/erreur |
| `T.cardRadius` | `16` | `16` | Radius cards/surfaces (formes iOS arrondies — D-12) |
| `T.radiusXs/Sm/Md/Lg/Xl` | `8/12/16/22/28` | idem | Échelle de rayons iOS (D-12) |
| `T.fab` | `18` | `18` | Rayon du FAB squircle (D-12) |
| `T.pill` | `999` | `999` | Pills / toggles entièrement arrondis (D-12) |

| Token (`F.xxx`) | Police | Usage |
|-----------------|--------|-------|
| `F.serif` | CormorantGaramond_400Regular_Italic | Titres, commentaires, labels éditoriaux |
| `F.serifLight` | CormorantGaramond_300Light_Italic | Gros titres 38–64px |
| `F.serifMedium` | CormorantGaramond_500Medium_Italic | Guillemets, accents |
| `F.sans` | InterTight_400Regular | Corps de texte UI |
| `F.sansLight` | InterTight_300Light | Texte secondaire |
| `F.sansMedium` | InterTight_500Medium | Boutons, labels importants |
| `F.sansSemi` | InterTight_600SemiBold | Emphase UI |
| `F.mono` | JetBrainsMono_400Regular | Eyebrows, métadonnées, N°001 |
| `F.monoMedium` | JetBrainsMono_500Medium | Mono emphasis |

**Conventions visuelles obligatoires :**
- **Aucun emoji** dans l'interface
- **Boutons** : `solid` (blanc), `coral` (rose), `ghost` (transparent+border), `danger`, `underline`
- **Inputs** : underline only — borderBottomWidth:1, borderBottomColor:T.border
- **Avatars** : carrés (borderRadius:0), initial serif italic en rose
- **Icônes** : SVG custom dans `components/icons.tsx` — PAS de @expo/vector-icons, PAS de MaterialCommunityIcons
- **useSafeAreaInsets()** pour les insets — jamais SafeAreaView
- **Copie éditoriale** : ton journal intime, "Sceller la page", "Page effacée", "le carnet", "le cercle", "Zone irréversible", EFFACER
- **Eyebrows** : F.mono, fontSize 9–10, letterSpacing 2–2.5, textTransform:'uppercase', color T.textFaint/T.primary
- **Formes (pivot D-12 — « éditorial sombre × iOS arrondi », Phases 2→5)** : cards, boutons, contrôles flottants et FAB adoptent des coins arrondis iOS via l'échelle de rayons (`radiusXs..Xl`, `cardRadius=16`, `pill=999`, `fab=18`). **Tout `borderRadius ≥ radiusSm` s'accompagne de `borderCurve:'continuous'`** (squircle iOS — prop per-style, pas un token). Le **FAB est un squircle** (`fab=18`), fini le carré. Les anciens « angles francs / `borderRadius:0` » ne sont plus la règle pour ces surfaces. **Exceptions inchangées cette phase** : « Avatars : carrés (borderRadius:0) » et « Inputs : underline only » restent tels quels (réévaluation Phases 5/3).

---

## Phases de développement

| Phase | Statut | Contenu |
|-------|--------|---------|
| 0 | ✅ Terminé | Scaffold, stores, hooks, types, migration SQL |
| 1 | ✅ Terminé | Auth (age-gate, login, register), layout tabs |
| D1 | ✅ Terminé | Design system Bold initial + support web Expo |
| D2 | ✅ Terminé | Refonte UI complète : noir/rose, typo éditoriale (MAJ.zip) |
| 2 | ✅ Terminé | Carte principale, FAB, création/affichage de points |
| 3 | ✅ Terminé | Heatmap |
| 4 | ✅ Terminé | Système d'amis + cercle |
| 5 | ✅ Terminé | Taguage partenaire + consentement |
| 6 | ✅ Terminé | Notifications push (expo push API) |
| 7 | ✅ Terminé | Profil, paramètres, avatar upload |
| D3 | ✅ Terminé | Système dark/light mode — themeStore, useTheme, makeStyles pattern sur tous les composants |
| MAJ | ✅ Terminé | Grosse mise à jour finale — Blocs A+C+D+E (voir détail ci-dessous) |
| TF1 | ✅ Terminé | Bugfix TestFlight — age gate bypass (index.tsx + trigger SQL), network request failed (timeout + ATS), bouton retour login/register |
| TF2 | ✅ Terminé | Round 2 — age gate dans register (stepper 2 étapes), null guards requests.tsx, filtres bottom sheet list.tsx, profil amélioré (avatar 80px, édition inline, section actions) |
| R3 | ✅ Terminé | Round 3 — C1: RLS profiles pending + fix requête requests.tsx · C2: profil unifié (settings fusionné, toggle thème IcoSun/IcoMoon) · C3: migration @rnmapbox/maps (AppMapView + PointMarker + HeatmapLayer + point/new + point/[id]) · C4: BlurView tab bar, PressableScale, PageHeader, COLORS, expo-haptics |
| R4 | ✅ Terminé | Round 4 — C1: création de point via RPC `create_point` (fix PostGIS WKT) + migration 007 · C2: tab bar opaque `#111114`/`#f2f2f7` (BlurView supprimé) · C3: "Cercle" → "Amis" dans stats profil · C4: expo-image-picker cameraPermission + Alert Linking.openSettings |
| 8 | 🔲 À faire | Audit sécurité |
| 9 | ✅ Terminé | Build EAS natif iOS #6, soumis à TestFlight (28/05/2026) |
| 10 | ✅ Terminé | Build EAS natif iOS #7 — fix cameraPermission expo-image-picker, soumis à TestFlight (28/05/2026) |
| R5 | ✅ Terminé | Round 5 — C1: create_point RPC v2 (UUID) + partner tagging dans hook · C2: carte toujours visible (hint non-bloquant) · C3: ImagePicker import statique |
| 11 | ✅ Terminé | Build EAS natif iOS #8 — R5 C3 expo-image-picker import statique, soumis à TestFlight (28/05/2026) |
| TF3 | ✅ Terminé | Hotfix OTA — ImagePicker revenu en dynamic require (try/catch) — fix crash onglet "Moi" (28/05/2026) |
| TF4 | ✅ Terminé | Fix crash natif onglet "Moi" — expo-file-system et expo-image-picker passés en dynamic require — Build EAS natif iOS #11, soumis à TestFlight (28/05/2026) |
| TF5 | ✅ Terminé | Build #13 : regression ImagePicker (import statique réintroduit par erreur) → crash onglet "Moi" revenu + création de point toujours échouée |
| TF6 | ✅ Terminé | Build #14 — fix définitif : ImagePicker dynamic require dans fonction + createPoint robuste aux deux signatures RPC (007 TABLE / 008 UUID) + erreurs Supabase visibles dans snackbar |
| TF7 | ✅ Terminé | Build #15 — migration 009 (colonnes address+happened_at + create_point UUID définitif) + suppression requestMediaLibraryPermissionsAsync() crash avatar |
| TF8 | ✅ Terminé | Build #16 — zoom : MarkerView→PointAnnotation (pins toujours visibles) · mention : migration 010 RLS + section taguages en attente dans requests.tsx |
| GSD-P1 | ✅ Code | Milestone Refonte UI/UX — Phase 1 (Stabilisation & Fondations) via GSD : lib/haptics.ts (FOND-03), AppText (FOND-04), câblage haptique sceller/consentement/suppression (IOS-03), socle natif reanimated v4 + gesture-handler + GestureHandlerRootView racine + runtimeVersion fingerprint (FOND-01/02). Détail : .planning/phases/01-stabilisation-fondations/ |
| STAB-fix | ✅ Terminé | Correctifs régressions #15/#16 : migration 011 (récursion RLS `42P17` sur `points` → STAB-02/03, fonction SECURITY DEFINER `is_pending_partner`) · migration 012 (RLS Storage bucket `avatars` — storage.objects sans policy → upload refusé) · expo-image-picker 16.0.6→17.0.11 (crash avatar) + expo-file-system legacy (lecture base64) → STAB-01 |
| 17 | ✅ Terminé | Build EAS #17 — socle natif validé device (worklets reanimated v4 OK, aucun gesture mort) ; STAB-01 encore KO (mismatch image-picker non encore corrigé) |
| 18 | ✅ Terminé | Build EAS #18 — fix expo-image-picker 17.0.11 + retrait smoke test reanimated. STAB-01 validé device (« Ça marche » : galerie OK, upload OK après migration 012). **Phase 1 terminée et vérifiée (8/8).** |
| GSD-P2 | ✅ Terminé | Phase 2 (Carte stylisée) vérifiée 4/4 + validée device #19 — pivot design D-12 (formes iOS arrondies, FAB squircle, design system révisé), heatmap rose→ambre, markers raffinés + sélection (refresh) + cascade, bandeau de contrôles éditorial, style Mapbox Studio custom enrichi. Détail : .planning/phases/02-carte-stylis-e/ |
| 19 | ✅ Terminé | Build EAS #19 — code Phase 2 complet + style Mapbox Studio custom `eloso/cmpvltt03…` (noir/rose enrichi : parcs, relief, 3D, halo rose, POI) injecté via EXPO_PUBLIC_MAPBOX_STYLE (env EAS + .env.local). Submit TestFlight OK, validé device. **Phase 2 terminée (4/4).** |
| GSD-P3 | ✅ Terminé | Phase 3 (Création & Détail) **validée device #26** — **restructuration navigation** : `app/(app)/_layout.tsx` est un `<Stack>`, les 5 écrans tabs sont dans `app/(app)/(tabs)/`, `point/new` + `point/[id]` sont des routes **`modal`** (cf. règle 19, plus de `formSheet`). Modal d'aperçu marker supprimée (tap-pin → détail direct). Création/détail refondus « page de carnet » (serif+mono, note d'abord), date détail en segments JJ/MM/AAAA (anti-freeze #2125), dismiss-confirm via `usePreventRemove`. Aperçu carte = **`<Image>` statique Mapbox** (restauré #27, fiable en modal) + pin RN. Détail : .planning/phases/03-cr-ation-d-tail-de-point-sheets-natifs/ |
| 20-27 | ✅ Terminé | Builds EAS #20→#27 — cycle de correctifs « sheets noirs » révélé par validation device. **Cause racine (#26)** : `formSheet` cassé sur iOS 26 + react-native-screens 4.16 (RNS [#3235](https://github.com/software-mansion/react-native-screens/issues/3235), contenu ancré en bas = sheet noir, non corrigé jusqu'à 4.20+, non corrigeable JS) → bascule **`presentation: 'modal'`** (règle 19). Étapes : aperçu carte retiré (MapView GL & `<Image>` noirs en formSheet) → location stamp/adresse · layout (no KAV + `contentInsetAdjustmentBehavior="never"` + `automaticallyAdjustKeyboardInsets`) · #25 taille explicite (a empiré) · **#26 modal = validé device** · **#27 aperçu carte `<Image>` statique restauré** (fiable en modal, validé device). |
| GSD-P4 | ✅ Terminé | Phase 4 (Listes & Cercle) **validée device #28** — refonte « table des matières » des 3 écrans : **liste** (`point/list`, note /10 en gros chiffre serif `T.text` sans N°00X, sections par mois sticky, **filtres en pills inline**, `FiltersBottomSheet.tsx` **supprimé**), **cercle** (`friends/index`, annuaire éditorial + **retrait d'ami** via Alert/`haptics.warn`/`useFriends.unfriend`), **demandes** (`friends/requests`, 2 sections eyebrow + Envoyées, **consentement taguage INLINE** via nouvelle méthode `useFriends.respondToTag` mono-table `point_partners` — `is_visible` via trigger). tsc baseline 36→**21** (suppression FiltersBottomSheet) ; 0 nouvelle erreur. Cycle GSD complet (discuss→ui→plan→execute). Détail : .planning/phases/04-listes-cercle/ |
| 28 | ✅ Terminé | Build EAS natif iOS #28 — code Phase 4, soumis TestFlight, **validé device** (clair + sombre). Milestone 4/5 phases (80 %). |
| GSD-P5 | ✅ Terminé | Phase 5 (Auth, Profil & Finitions) **validée device #29** — **dernière phase**. **Auth « page de couverture »** : `login` compact (eyebrow « LOVEMAP · ÉDITION INTIME », champs visibles), `register` stepper restylé + **fix bug `MIN_AGE`** (`register.tsx` importait `{ MIN_AGE }` inexistant → `APP_CONFIG.MIN_AGE` ; vérif client < 18 désormais active, trigger serveur autoritaire inchangé) + CTA « Vérifier mon âge ». **Profil « page de couverture »** : avatar carré + bento Analyse (grande tuile = `points.length` « PAGES DU CARNET » en `T.text`), toggle thème unique + a11y, **suppression compte = Alert seule** (champ « EFFACER » retiré), **avatar upload préservé verbatim** (règles 14/15/17). **IOS-04** : `AppText` variant `display` + plafonds Dynamic Type par rôle, sweep home-indicator (`insets.bottom`) + tokens sur les 9 écrans, clair + sombre. tsc 21→**20** (fix MIN_AGE) ; 0 nouvelle erreur. Détail : .planning/phases/05-auth-profil-finitions/ |
| 29 | ✅ Terminé | Build EAS natif iOS #29 — code Phase 5, soumis TestFlight, **validé device** (clair + sombre + Dynamic Type). **🎉 Milestone v1.0 « Refonte UI/UX iOS » TERMINÉ : 5/5 phases, 22/22 requirements, builds #17→#29.** |
| 30-32 | ✅ Terminé | Revue écran-par-écran (modifs device-driven) — vue ami (masque ma position, points de l'ami), tri carnet croissant/décroissant, multi-partenaires (min 1), filtre statut carnet (en attente/validé), photos de profil partout, bloc « Avec » sous la note, **carte = points validés uniquement**, pins groupés par lieu + pastille N, eau bleue, swipe-delete carnet, stats profil = validés only, fix « Sceller la page » (faux abandon + doublons). Builds #30→#32. |
| R6 | ✅ Terminé (device #34) | Finition UI/UX avant publication — **« Moi »** (en-tête couverture horizontal avatar+prénom, marges 24, tuile hero resserrée) · **« Amis »** (FriendItem regroupé avatar+nom+@pseudo, avatar 46, actions Carte·Retirer à droite, header aligné 24). 0 nouvelle erreur tsc. |
| Pins | ✅ Terminé (device #34) | Refonte marqueurs (brief `refonte pins`) — pin **« sceau »** (disque rose, **note gravée** serif italic, tige sur la coordonnée, teinte via `constants/markers.ts`, pastille N) + relevé **point blanc pulsant** (`UserLocationMarker.tsx`, MarkerView, remplace le point bleu, reduce-motion). **Cause racine #33** : PointAnnotation ne rend pas le `<Text>` custom (sceau gris transparent) → **bascule MarkerView** (règle 20), validé #34. |
| Notif | ✅ Terminé (prod) | Notifications push 3 événements (mention reçue · réponse mention · ami a posté) — migration 013, triggers serveur `pg_net` (cf. section Notifications). Actif en prod, indépendant du build. |
| Modération | ✅ Terminé | Signalement + blocage + EULA (App Store Guideline 1.2) — migration 014 (`user_blocks`, `content_reports`, trigger anti-amitié bloquée), `useFriends.blockUser/reportContent`, UI cercle (appui long) + détail moment (« Signaler »/« Bloquer l'auteur »), liens légaux profil. Pages `docs/*.html` (GitHub Pages) + kit `store/app-store-listing.md`. Préparation publication App Store. |
| 33-34 | ✅ Terminé | Builds EAS #33→#34. #33 : refonte marqueurs (sceaux KO en PointAnnotation). **#34 : pins en MarkerView (validé device), notifs serveur actives — build candidat App Store.** |
| AppStore-refus | 🟡 Code prêt | **Refus Apple Guideline 2.1a sur build 36** : (1) « App unresponsive on launch » iPad Air M3 / iPadOS 26.5, (2) « Placeholder text in the name ». **Correctifs code (règle 22)** : `supportsTablet` déjà `false` (rien à changer) ; **fix cause racine freeze** = `useFonts` ne hangue plus (`if (!fontsLoaded && !fontError)` dans `app/_layout.tsx`) ; **error boundary global** `components/ui/AppErrorBoundary.tsx` autour de `GestureHandlerRootView`. 0 nouvelle erreur tsc (16, toutes pré-existantes). **Restant côté Louis** : corriger métadonnées App Store Connect (Name/Subtitle/Description/Keywords/Privacy URL) **manuellement**, puis nouveau build natif `eas build -p ios --profile production` (autoIncrement) + `eas submit -p ios --latest`. |
| 37 | 🟡 En review | **Build EAS natif iOS #37 — candidat re-soumission App Store** (correctifs refus build 36). **Cause racine n°2 du « placeholder text in the name » identifiée** : le nom App Store Connect était `LoveMap (e5fa1e)` — le suffixe `(e5fa1e)` (auto-ajouté car « LoveMap » seul est **déjà pris** sur l'App Store) ressemble à du placeholder. **Renommé `LoveMap - Carnet intime`** (unique, propre) dans les **deux** localisations FR + EN(US). Build 37 (anti-freeze polices + AppErrorBoundary) buildé + `eas submit` → binaire uploadé ASC, en traitement Apple. **Restant** : attacher build 37 à la version 1.0 dans ASC, soumettre, répondre au Resolution Center. |

> Mettre à jour ce tableau à chaque phase complétée. **v1.0 + refonte marqueurs + notifs : build #34 validé device, candidat publication App Store.**

### Détail phase MAJ

**Bloc A — Corrections critiques**
- A1 : `register.tsx` transmet la vraie date de naissance depuis `authStore` (fix `date_of_birth`)
- A2 : `themeStore` persisté via `zustand/middleware` + AsyncStorage — thème survit au redémarrage
- A3 : `database.types.ts` resynchronisé (ajout `address`, `point_photos`) ; `app.types.ts` ajout `PointPhoto`

**Bloc C — Filtres & pull-to-refresh**
- `point/list.tsx` : filtres par note minimale (0/5/7/9+), tri date/note, pull-to-refresh, skeleton loaders, snackbar erreur réseau
- `friends/index.tsx` : pull-to-refresh, skeleton loaders

**Bloc D — Profil enrichi**
- D2 : section "Analyse" dans `profile/index.tsx` — distribution des notes (barres), top 3 mois, durée totale
- D3 : bouton "Carte" sur chaque `FriendItem` → navigue vers Map en mode vue ami

**Bloc E — Polish & solidité**
- E1 : section "Email" dans `settings.tsx` — changement d'email via `supabase.auth.updateUser`
- E2 : `SkeletonItem.tsx` — composant skeleton réutilisable (pulse Animated.loop), remplace ActivityIndicator dans list + friends
- E3 : `usePoints` et `useFriends` retournent `Promise<boolean>` — erreurs propagées jusqu'aux screens via Snackbar

**Formulaire point/new.tsx**
- Partenaire **obligatoire** — `handleSubmit` bloque si `selectedPartnerId === null`
- CTA désactivé si `friends.length === 0`
- Section Date ajoutée (JJ/MM/AAAA, pré-remplie à aujourd'hui), `happened_at` alimenté par l'utilisateur
- Labels renommés : "Note d'intensité" → "Note", "Note libre" → "Commentaire"

---

## Contraintes de sécurité absolues

1. Ne **jamais** utiliser la Supabase Service Role Key côté client
2. Ne **jamais** désactiver RLS, même temporairement pour déboguer
3. Ne **jamais** exposer `push_token` ou `date_of_birth` d'un autre utilisateur
4. **Toujours** vérifier `creator_id === auth.uid()` avant toute modification
5. Le système de consentement (`is_visible`) reste géré par le trigger SQL — aucun bypass côté client

---

## Variables d'environnement requises

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1...          # Token public Mapbox (affiché dans la carte)
EXPO_PUBLIC_MAPBOX_STYLE=mapbox://styles/mapbox/dark-v11  # Optionnel — style de carte personnalisé
```

Fichier : `.env.local` à la racine (jamais commité — présent dans `.gitignore`)

**Secret EAS requis pour le build natif :**
```bash
eas env:create production --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN --value "sk.eyJ1..." --scope project --visibility secret --type string --non-interactive
```
Le `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (`sk.xxx`) est le token secret Mapbox pour télécharger le SDK natif pendant le build EAS. Le podspec de `@rnmapbox/maps` le lit via `ENV['RNMAPBOX_MAPS_DOWNLOAD_TOKEN']` — ne pas utiliser `RNMapboxMapsDownloadToken` dans `app.json` (déprécié, écrit le token en clair dans le Podfile). À créer une seule fois avant `eas build`.

---

## Checklist de fin de tâche

Avant de considérer une tâche comme terminée, vérifier dans l'ordre :

- [ ] Le code fonctionne et a été testé
- [ ] `git add . && git commit -m "..." && git push origin master` → succès (branche `master`, PAS `main`)
- [ ] `eas update --branch main --message "..."` → succès (ici « main » = canal EAS Update, sans rapport avec la branche git ; ⚠️ les OTA ne descendent pas toujours sur device — un build natif reste la voie fiable pour valider)
- [ ] `CLAUDE.md` mis à jour si nécessaire (phases, archi, règles) → commité avec le push

**Une tâche n'est terminée que quand ces 4 points sont cochés.**

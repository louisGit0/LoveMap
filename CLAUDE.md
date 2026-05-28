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
**Dépôt GitHub** : https://github.com/louisGit0/LoveMap (branche : `main`)  
**Propriétaire** : Louis (louisGit0)

**Concept** : LoveMap permet à des utilisateurs adultes de poser des points géolocalisés sur les lieux où ils ont eu un rapport sexuel, de les annoter (note /10, commentaire, durée), de les visualiser sous forme de heatmap, et de les partager uniquement avec des amis approuvés via un système de consentement double.

---

## Workflow obligatoire après CHAQUE modification

**Sans exception, dans cet ordre :**

```bash
# 1. Commit et push sur GitHub
git add .
git commit -m "feat/fix/chore: description courte de la modification"
git push origin main

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
│       └── profile/index.tsx     # Profil + stats + toggle thème + email/mdp/delete (settings fusionné)
├── components/
│   ├── map/
│   │   ├── AppMapView.tsx        # Carte mobile (@rnmapbox/maps — MapboxGL.MapView + Camera)
│   │   ├── AppMapView.web.tsx    # Placeholder web
│   │   ├── PointMarker.tsx       # Marker mobile (MapboxGL.MarkerView)
│   │   ├── PointMarker.web.tsx   # Stub web (null)
│   │   ├── HeatmapLayer.tsx      # Heatmap mobile (MapboxGL.ShapeSource + HeatmapLayer)
│   │   ├── HeatmapLayer.web.tsx  # Stub web (null)
│   │   ├── MapHeader.tsx         # Toggle pins/heatmap
│   │   └── FriendSelector.tsx    # Sélecteur d'ami pour filtre carte
│   ├── point/                    # PointForm, PointListItem (PressableScale), PhotoPicker, FiltersBottomSheet
│   ├── friends/                  # FriendItem, FriendRequestItem
│   └── ui/
│       ├── Button.tsx            # Pill button custom (primary/ghost)
│       ├── Input.tsx             # Input avec tokens Bold
│       ├── SkeletonItem.tsx      # Skeleton loader animé (SkeletonItem + SkeletonRow)
│       ├── PressableScale.tsx    # Animated.spring scale on press (remplace TouchableOpacity)
│       └── PageHeader.tsx        # Header réutilisable (eyebrow + titre + back + slot droit)
├── constants/
│   ├── config.ts                 # MIN_AGE, APP_NAME, MAPBOX_STYLE, COLORS (palette fixe)
│   └── theme.ts                  # Design tokens Bold (T.bg, T.primary, T.pill…)
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
│   ├── useFriends.ts             # CRUD amitiés + demandes
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
│   └── 006_profiles_pending_rls.sql # profiles_select élargi à status IN ('pending','accepted')
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
14. **Permissions manquantes (image picker)** — quand une permission est refusée, afficher un `Alert` natif avec un bouton "Ouvrir les réglages" appelant `Linking.openSettings()`. Ne pas se contenter d'un Snackbar.
15. **Modules natifs Expo : toujours importer via `require` dynamique** — NE JAMAIS utiliser d'import statique (`import * as X from 'expo-...'`) pour les modules natifs facultatifs (`expo-image-picker`, `expo-file-system`, etc.). Utiliser exclusivement le pattern `let X: typeof import('expo-...') | null = null; try { X = require('expo-...'); } catch { X = null; }` placé APRÈS tous les `import`. Un import statique d'un module natif non lié peut crasher l'écran entier au chargement — crash natif non catchable par ErrorBoundary. Placer le require à l'intérieur de la fonction qui l'utilise si le module n'est pas nécessaire au rendu.

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
| `T.cardRadius` | `4` | `4` | Radius max (angles francs) |

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
| TF4 | ⏳ En attente build | Fix crash natif onglet "Moi" — expo-file-system et expo-image-picker passés en dynamic require — build iOS #9 bloqué quota EAS (reset 01/06/2026) |

> Mettre à jour ce tableau à chaque phase complétée.

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
- [ ] `git add . && git commit -m "..." && git push origin main` → succès
- [ ] `eas update --branch main --message "..."` → succès
- [ ] `CLAUDE.md` mis à jour si nécessaire (phases, archi, règles) → commité avec le push

**Une tâche n'est terminée que quand ces 4 points sont cochés.**

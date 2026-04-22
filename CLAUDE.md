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
| react-native-maps | 1.20.1 | Carte interactive (mobile uniquement) |
| Zustand | v4 | State management |
| React Native Paper | v5 | Composants UI (usage réduit — UI principale via theme.ts) |
| expo-location | ~19.0.8 | Géolocalisation |
| expo-notifications | ~0.32.16 | Push notifications |
| react-dom + react-native-web | 19.1.0 / ^0.21.0 | Support web Expo |

---

## Architecture du projet

```
lovemap/
├── app/                          # Expo Router — routing file-based
│   ├── _layout.tsx               # Root layout (PaperProvider + auth listener)
│   ├── index.tsx                 # Redirect : age-gate → login → map
│   ├── (auth)/                   # Routes non protégées
│   │   ├── age-gate.tsx          # Vérification d'âge (18+) — design Bold
│   │   ├── login.tsx             # Connexion — design Bold
│   │   └── register.tsx          # Inscription — design Bold
│   └── (app)/                    # Routes protégées (session requise)
│       ├── _layout.tsx           # Bottom tab navigator (Carte, Cercle, Profil)
│       ├── map/index.tsx         # Carte principale + FAB
│       ├── point/new.tsx         # Création d'un point
│       ├── point/[id].tsx        # Détail / consentement partenaire
│       ├── friends/index.tsx     # "Cercle" — liste amis + recherche
│       ├── friends/requests.tsx  # Demandes d'amitié
│       ├── profile/index.tsx     # Profil + stats (design Bold)
│       └── profile/settings.tsx  # Paramètres + suppression compte
├── components/
│   ├── map/
│   │   ├── AppMapView.tsx        # Carte mobile (react-native-maps)
│   │   ├── AppMapView.web.tsx    # Placeholder web
│   │   ├── PointMarker.tsx       # Marker mobile
│   │   ├── PointMarker.web.tsx   # Stub web (null)
│   │   ├── HeatmapLayer.tsx      # Heatmap mobile
│   │   ├── HeatmapLayer.web.tsx  # Stub web (null)
│   │   ├── MapHeader.tsx         # Toggle pins/heatmap
│   │   └── FriendSelector.tsx    # Sélecteur d'ami pour filtre carte
│   ├── point/                    # PointForm, PointListItem, PhotoPicker
│   ├── friends/                  # FriendItem, FriendRequestItem
│   └── ui/
│       ├── Button.tsx            # Pill button custom (primary/ghost)
│       └── Input.tsx             # Input avec tokens Bold
├── constants/
│   ├── config.ts                 # MIN_AGE = 18
│   └── theme.ts                  # Design tokens Bold (T.bg, T.primary, T.pill…)
├── lib/
│   ├── supabase.ts               # Client Supabase initialisé + typé
│   ├── notifications.ts          # Helpers Expo Push
│   └── react-native-maps.web.js  # Stub complet react-native-maps pour web
├── metro.config.js               # Alias react-native-maps → stub sur platform=web
├── stores/                       # Zustand
│   ├── authStore.ts              # session, user, profile, ageVerified
│   ├── mapStore.ts               # points, viewMode (pins/heatmap)
│   └── friendStore.ts            # friends, pendingReceived, pendingSent
├── hooks/
│   ├── useAuth.ts                # fetchProfile, signOut
│   ├── usePoints.ts              # CRUD points + conversion PostGIS→MapPoint
│   └── useFriends.ts             # CRUD amitiés + demandes
├── types/
│   ├── database.types.ts         # Types générés Supabase
│   └── app.types.ts              # Types métier (MapPoint, FriendWithProfile…)
├── supabase/migrations/
│   ├── 001_initial_schema.sql    # Schéma complet + RLS
│   ├── 002_partner_edit.sql
│   ├── 003_point_photos.sql
│   └── 004_point_address.sql
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

### Règles métier critiques

- `is_visible` passe à `TRUE` **uniquement** via le trigger SQL `on_partner_consent` — ne jamais le modifier côté client directement
- Un point sans partenaire tagué reste `is_visible = FALSE` — visible uniquement par son créateur via RLS
- RLS est actif sur toutes les tables — ne jamais utiliser la service key côté client
- `search_users(query)` est la seule fonction exposée pour chercher des utilisateurs (exclut date_of_birth et push_token)

---

## Règles de code obligatoires

1. **TypeScript strict** — pas de `any` sauf retours Supabase bruts (à typer immédiatement)
2. **Gestion d'état réseau** — chaque composant faisant un appel réseau gère 3 états : loading / success / error
3. **Erreurs utilisateur** — afficher via Snackbar React Native Paper, pas uniquement en console
4. **Pas d'appels Supabase dans les composants** — tout passe par les hooks (`useAuth`, `usePoints`, `useFriends`)
5. **Pas de logique métier dans les composants UI** — uniquement dans les hooks ou stores
6. **Tous les textes de l'interface sont en français**

---

## Identité visuelle — Design Bold

Tous les tokens sont dans `constants/theme.ts` (objet `T`). **Ne pas hardcoder de couleurs.**

| Token (`T.xxx`) | Valeur | Usage |
|-----------------|--------|-------|
| `T.bg` | `#0a0610` | Fond global |
| `T.surface` | `#17131e` | Surface / cards |
| `T.surface2` | `#221829` | Surface secondaire |
| `T.border` | `#2d2040` | Bordures |
| `T.text` | `#fff4f8` | Texte principal |
| `T.textDim` | `#a090a8` | Texte secondaire |
| `T.textFaint` | `#6a5a72` | Texte tertiaire / inactif |
| `T.primary` | `#ec2d8c` | Couleur primaire (magenta) |
| `T.secondary` | `#8b33cc` | Couleur secondaire (violet) |
| `T.success` | `#4ade80` | Succès |
| `T.danger` | `#f87171` | Erreur / danger |
| `T.cardRadius` | `18` | Border radius cards |
| `T.pill` | `999` | Border radius pill (boutons, badges) |

**Conventions visuelles :**
- Titres principaux : italic, fontWeight `300` (light), grande taille
- Eyebrow labels : uppercase, letterSpacing 1.5, fontSize 11, couleur `T.textDim`
- Boutons primaires : pill (borderRadius T.pill), backgroundColor T.primary
- Boutons secondaires : ghost (transparent, borderColor T.border)
- Tab "Amis" renommé **"Cercle"**

---

## Phases de développement

| Phase | Statut | Contenu |
|-------|--------|---------|
| 0 | ✅ Terminé | Scaffold, stores, hooks, types, migration SQL |
| 1 | ✅ Terminé | Auth (age-gate, login, register), layout tabs — design Bold |
| D | ✅ Terminé | Intégration design system Bold + support web Expo |
| 2 | 🔲 À faire | Carte, création/affichage de points |
| 3 | 🔲 À faire | Heatmap |
| 4 | 🔲 À faire | Système d'amis |
| 5 | 🔲 À faire | Taguage partenaire + consentement |
| 6 | 🔲 À faire | Notifications push |
| 7 | 🔲 À faire | Profil & paramètres |
| 8 | 🔲 À faire | Audit sécurité |
| 9 | 🔲 À faire | Déploiement EAS |

> Mettre à jour ce tableau à chaque phase complétée.

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
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

Fichier : `.env.local` à la racine (jamais commité — présent dans `.gitignore`)

---

## Checklist de fin de tâche

Avant de considérer une tâche comme terminée, vérifier dans l'ordre :

- [ ] Le code fonctionne et a été testé
- [ ] `git add . && git commit -m "..." && git push origin main` → succès
- [ ] `eas update --branch main --message "..."` → succès
- [ ] `CLAUDE.md` mis à jour si nécessaire (phases, archi, règles) → commité avec le push

**Une tâche n'est terminée que quand ces 4 points sont cochés.**

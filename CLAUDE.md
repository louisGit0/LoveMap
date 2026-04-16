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
| react-native-maps | 1.20.1 | Carte interactive |
| Zustand | v4 | State management |
| React Native Paper | v5 | Composants UI (Snackbar, FAB, Menu) |
| expo-location | ~19.0.8 | Géolocalisation |
| expo-notifications | ~0.32.16 | Push notifications |
| expo-image-picker | ~16.x | Sélection/capture photo avatar |

---

## Architecture du projet

```
lovemap/
├── app/                          # Expo Router — routing file-based
│   ├── _layout.tsx               # Root layout (PaperProvider + auth listener)
│   ├── index.tsx                 # Redirect : age-gate → login → map
│   ├── (auth)/                   # Routes non protégées
│   │   ├── age-gate.tsx          # Vérification d'âge (18+)
│   │   ├── login.tsx             # Connexion
│   │   └── register.tsx          # Inscription
│   └── (app)/                    # Routes protégées (session requise)
│       ├── _layout.tsx           # Bottom tab navigator (4 onglets + écrans cachés)
│       ├── map/index.tsx         # Carte principale
│       ├── point/new.tsx         # Création d'un point (partenaire obligatoire)
│       ├── point/[id].tsx        # Détail / consentement partenaire (édition avant approbation)
│       ├── points/index.tsx      # Liste de mes points avec recherche et tri
│       ├── friends/index.tsx     # Hub Social : onglets Amis + Messages
│       ├── friends/requests.tsx  # Demandes d'amitié
│       ├── social/
│       │   ├── friend-map/
│       │   │   └── [userId].tsx  # Carte plein écran des points d'un ami
│       │   └── messages/
│       │       ├── index.tsx     # Liste des conversations
│       │       └── [userId].tsx  # Écran de conversation avec Realtime
│       ├── profile/index.tsx     # Profil + stats + avatar + édition display_name
│       └── profile/settings.tsx  # Paramètres + suppression compte
├── components/
│   ├── map/                      # AppMapView, PointMarker, HeatmapLayer
│   ├── point/                    # PointForm, PointCard
│   ├── friends/                  # FriendItem, FriendRequestItem
│   └── ui/                       # Button, Input (wrappers React Native Paper)
├── lib/
│   ├── supabase.ts               # Client Supabase initialisé + typé
│   └── notifications.ts          # Helpers Expo Push
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
├── constants/config.ts           # MIN_AGE = 18
├── supabase/migrations/
│   ├── 001_initial_schema.sql    # Schéma complet + RLS (déjà exécuté en base)
│   └── 002_messages.sql          # Table messages + RLS + accept_point_as_partner RPC
└── CLAUDE.md                     # Ce fichier — à consulter et maintenir
```

---

## Base de données Supabase

**URL du projet** : dans `.env.local` → `EXPO_PUBLIC_SUPABASE_URL`

### Tables

| Table | Colonnes clés | Notes |
|-------|--------------|-------|
| `profiles` | id, username, display_name, date_of_birth, push_token, avatar_url | Liée 1:1 à auth.users via trigger |
| `points` | id, creator_id, location (GEOMETRY), note 1-10, comment, duration_minutes, is_visible | is_visible=FALSE par défaut |
| `point_partners` | point_id, partner_id, status (pending/accepted/rejected), notified_at, responded_at | Consentement du partenaire tagué |
| `friendships` | requester_id, addressee_id, status (pending/accepted/rejected/blocked) | Relation bidirectionnelle |
| `messages` | id, sender_id, recipient_id, content (≤1000 chars), read_at, created_at | Messages directs entre amis |

### Fonctions RPC exposées

| Fonction | Usage |
|----------|-------|
| `search_users(query)` | Recherche d'utilisateurs (exclut date_of_birth et push_token) |
| `accept_point_as_partner(p_point_id, p_new_note, p_new_comment, p_new_duration)` | Permet au partenaire d'éditer les champs puis approuver (SECURITY DEFINER — bypass RLS sécurisé) |

### Règles métier critiques

- `is_visible` passe à `TRUE` **uniquement** via le trigger SQL `on_partner_consent` — ne jamais le modifier côté client directement
- **Un partenaire est obligatoire** à la création d'un point — le bouton "Enregistrer" reste désactivé sans partenaire sélectionné
- Le partenaire peut modifier note/commentaire/durée avant d'approuver via `accept_point_as_partner` RPC
- Un point sans partenaire approuvé reste `is_visible = FALSE` — visible uniquement par son créateur via RLS
- RLS est actif sur toutes les tables — ne jamais utiliser la service key côté client
- `search_users(query)` est la seule fonction exposée pour chercher des utilisateurs (exclut date_of_birth et push_token)

---

## Règles de code obligatoires

1. **TypeScript strict** — pas de `any` sauf retours Supabase bruts (à typer immédiatement)
2. **Gestion d'état réseau** — chaque composant faisant un appel réseau gère 3 états : loading / success / error
3. **Erreurs utilisateur** — afficher via Snackbar React Native Paper, pas uniquement en console
4. **Pas d'appels Supabase dans les composants** — tout passe par les hooks (`useAuth`, `usePoints`, `useFriends`) — exception tolérée pour les écrans de messagerie et friend-map qui ont leur propre logique Realtime locale
5. **Pas de logique métier dans les composants UI** — uniquement dans les hooks ou stores
6. **Tous les textes de l'interface sont en français**
7. **Partenaire obligatoire** — ne jamais permettre la création d'un point sans partenaire sélectionné

---

## Identité visuelle

| Token | Valeur |
|-------|--------|
| Fond global | `#0f0f0f` |
| Surface / cards | `#1a1a1a` |
| Bordures | `#2a2a2a` |
| Primaire | `#e91e8c` (rose/magenta) |
| Secondaire | `#9c27b0` (violet) |
| Texte principal | `#ffffff` |
| Texte secondaire | `#888888` |
| Danger | `#f44336` |
| Succès | `#4caf50` |
| Border radius cards | 12px |
| Border radius inputs | 8px |

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

# LoveMap — Prompt Claude Code

## Contexte

Tu es le développeur principal de **LoveMap**, une application mobile React Native (Expo) destinée aux adultes. Le scaffold du projet est déjà en place. Tu dois implémenter l'application feature par feature, dans l'ordre des phases décrit ci-dessous, sans jamais sauter une étape.

---

## Stack technique (ne pas dévier)

| Outil | Usage |
|-------|-------|
| React Native + Expo SDK 51 | Framework mobile |
| TypeScript strict | Langage (pas de `any` sans justification) |
| Expo Router v3 (file-based) | Navigation |
| Supabase JS v2 | Backend, Auth, DB, Realtime |
| react-native-maps | Carte interactive |
| Zustand v4 | State management |
| React Native Paper v5 | Composants UI |
| expo-location | Géolocalisation |
| expo-notifications | Push notifications |

---

## Architecture existante (scaffold déjà créé)

```
lovemap/
├── app/
│   ├── _layout.tsx              ✅ Root layout (PaperProvider + auth listener)
│   ├── index.tsx                ✅ Redirect logic (age-gate → login → map)
│   ├── (auth)/
│   │   ├── _layout.tsx          ✅
│   │   ├── age-gate.tsx         🔲 À implémenter
│   │   ├── login.tsx            🔲 À implémenter
│   │   └── register.tsx         🔲 À implémenter
│   └── (app)/
│       ├── _layout.tsx          🔲 Bottom tabs à compléter
│       ├── map/index.tsx        🔲 À implémenter
│       ├── point/new.tsx        🔲 À implémenter
│       ├── point/[id].tsx       🔲 À implémenter
│       ├── friends/index.tsx    🔲 À implémenter
│       ├── friends/requests.tsx 🔲 À implémenter
│       ├── profile/index.tsx    🔲 À implémenter
│       └── profile/settings.tsx 🔲 À implémenter
├── components/
│   ├── map/
│   │   ├── AppMapView.tsx       🔲 À compléter
│   │   ├── PointMarker.tsx      🔲 À compléter
│   │   └── HeatmapLayer.tsx     🔲 À compléter
│   ├── point/
│   │   ├── PointForm.tsx        🔲 À créer
│   │   └── PointCard.tsx        🔲 À créer
│   ├── friends/
│   │   ├── FriendItem.tsx       🔲 À créer
│   │   └── FriendRequestItem.tsx 🔲 À créer
│   └── ui/
│       ├── Button.tsx           ✅
│       └── Input.tsx            ✅
├── lib/
│   ├── supabase.ts              ✅ Client Supabase initialisé
│   └── notifications.ts        ✅ Helpers push
├── stores/
│   ├── authStore.ts             ✅ Session + profil + ageVerified
│   ├── mapStore.ts              ✅ Points + viewMode
│   └── friendStore.ts          ✅ Amis + demandes
├── hooks/
│   ├── useAuth.ts               ✅ fetchProfile + signOut
│   ├── usePoints.ts             ✅ CRUD points
│   └── useFriends.ts           ✅ CRUD amitiés
├── types/
│   ├── database.types.ts        ✅ Types Supabase
│   └── app.types.ts             ✅ Types métier
├── constants/config.ts          ✅ MIN_AGE = 18
└── supabase/migrations/
    └── 001_initial_schema.sql   ✅ Schéma complet + RLS
```

---

## Schéma de base de données (déjà en place dans Supabase)

### Tables

**profiles** — `id` UUID PK (= auth.users.id), `username` TEXT UNIQUE, `display_name` TEXT, `avatar_url` TEXT nullable, `date_of_birth` DATE, `push_token` TEXT nullable, `created_at`, `updated_at`

**points** — `id` UUID PK, `creator_id` UUID FK→profiles, `location` GEOMETRY(Point,4326), `note` SMALLINT 1-10, `comment` TEXT nullable, `duration_minutes` SMALLINT nullable, `is_visible` BOOLEAN DEFAULT FALSE, `created_at`, `updated_at`

**point_partners** — `id` UUID PK, `point_id` UUID FK→points, `partner_id` UUID FK→profiles, `status` consent_status ('pending'|'accepted'|'rejected'), `notified_at`, `responded_at` nullable

**friendships** — `id` UUID PK, `requester_id` UUID FK→profiles, `addressee_id` UUID FK→profiles, `status` friendship_status ('pending'|'accepted'|'rejected'|'blocked'), `created_at`, `updated_at`

### Règles métier critiques (à ne jamais contourner)
- `is_visible` passe à `TRUE` uniquement via le trigger `on_partner_consent` (quand le partenaire accepte)
- Un point sans partenaire tagué reste `is_visible = FALSE` côté DB — il est visible uniquement par son créateur via la RLS policy `points_select`
- RLS est actif sur toutes les tables : ne jamais utiliser la service key côté client
- La fonction `search_users(query)` est la seule façon de chercher des utilisateurs (elle exclut les données sensibles)

---

## Instructions générales de développement

### Règles de code obligatoires
1. TypeScript strict — pas de `any` sauf pour les retours Supabase bruts (à typer immédiatement après)
2. Chaque composant qui fait un appel réseau doit gérer 3 états : loading, success, error
3. Les erreurs doivent être affichées à l'utilisateur via un Snackbar React Native Paper — pas de `console.error` seul
4. Utiliser les hooks existants (`useAuth`, `usePoints`, `useFriends`) — ne pas appeler `supabase` directement depuis les écrans
5. Pas de logique métier dans les composants UI — tout dans les hooks ou stores
6. Les composants `components/ui/` sont les seuls à utiliser React Native Paper directement
7. Tous les textes de l'interface sont en français

### Style visuel (cohérence sur toute l'app)
- Fond global : `#0f0f0f`
- Surface/cards : `#1a1a1a`
- Bordures : `#2a2a2a`
- Couleur primaire : `#e91e8c` (rose/magenta)
- Couleur secondaire : `#9c27b0` (violet)
- Texte principal : `#ffffff`
- Texte secondaire : `#888888`
- Danger/suppression : `#f44336`
- Succès : `#4caf50`
- Border radius : 12px pour les cards, 8px pour les inputs
- Font : système (SF Pro sur iOS, Roboto sur Android)

---

## PHASE 1 — Authentification & Onboarding

### Écran : `app/(auth)/age-gate.tsx`

**Comportement attendu :**
- Plein écran avec le logo LoveMap centré
- Titre : "Réservé aux adultes"
- Texte : "En continuant, vous confirmez avoir 18 ans ou plus et acceptez les conditions d'utilisation."
- Un champ date de naissance (DatePicker natif ou 3 selects jour/mois/année)
- Bouton "Confirmer mon âge"
- Si l'âge calculé est < 18 ans → afficher une erreur inline "Vous devez avoir 18 ans pour accéder à LoveMap"
- Si l'âge est >= 18 → appeler `useAuthStore().setAgeVerified(true)` et naviguer vers `/(auth)/login`
- Le résultat n'est PAS persisté (si l'app est relancée, la gate se réaffiche — sécurité minimale côté client)

**Implémentation :**
```
- Utiliser 3 Picker/Select pour jour/mois/année (pas de librairie externe)
- Calculer l'âge avec : new Date().getFullYear() - selectedYear (avec vérification du mois et jour)
- Animation fade-in au montage (Animated.Value)
- Fond sombre avec logo centré
```

---

### Écran : `app/(auth)/register.tsx`

**Comportement attendu :**
- Formulaire d'inscription en une seule page scrollable
- Champs requis :
  - Email (type email, validation format)
  - Mot de passe (min 8 caractères, avec icône show/hide)
  - Confirmation mot de passe
  - Nom d'affichage (2-30 caractères)
  - Username (3-20 caractères, uniquement lettres/chiffres/underscore, regex: `/^[a-zA-Z0-9_]+$/`)
  - Date de naissance (récupérée depuis le store si ageVerified=true, sinon re-demandée)
- Bouton "Créer mon compte"
- Lien "Déjà un compte ? Se connecter" → navigate vers login
- Validation inline sur chaque champ (message d'erreur sous le champ)

**Appel Supabase :**
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      username,
      display_name: displayName,
      date_of_birth: dateOfBirth, // format 'YYYY-MM-DD'
    }
  }
})
// Le trigger handle_new_user() créera automatiquement le profil
```

**Gestion des erreurs :**
- "User already registered" → "Un compte existe déjà avec cet email"
- Erreur username unique → "Ce nom d'utilisateur est déjà pris"
- Succès → navigate vers `/(app)/map`

---

### Écran : `app/(auth)/login.tsx`

**Comportement attendu :**
- Logo LoveMap en haut
- Champ email + champ mot de passe
- Bouton "Se connecter"
- Lien "Pas encore de compte ? S'inscrire"
- Lien "Mot de passe oublié ?" → appeler `supabase.auth.resetPasswordForEmail(email)`

**Appel Supabase :**
```typescript
await supabase.auth.signInWithPassword({ email, password })
```

- Succès → `useAuth().fetchProfile(user.id)` puis navigate vers `/(app)/map`
- Erreur → Snackbar "Email ou mot de passe incorrect"

---

### Layout : `app/(app)/_layout.tsx`

Remplacer le placeholder par un vrai Bottom Tab Navigator avec icônes :
- **Carte** → icône `map-marker` (MaterialCommunityIcons), route `map/index`
- **Amis** → icône `account-group`, route `friends/index` — badge si demandes en attente
- **Profil** → icône `account-circle`, route `profile/index`

Protéger le layout : si `!session` → rediriger vers `/(auth)/login`

---

## PHASE 2 — Carte interactive & Points

### Composant : `components/map/AppMapView.tsx`

**Compléter le composant existant :**
- Région initiale : position de l'utilisateur (via `expo-location`) ou Paris (48.8566, 2.3522) par défaut
- `onLongPress` → ouvre le formulaire de création de point avec les coordonnées pré-remplies
- Style dark map déjà configuré (garder tel quel)
- Afficher le bouton "Recentrer" si l'utilisateur a bougé la carte loin de sa position

**Gestion des permissions :**
```typescript
const { status } = await Location.requestForegroundPermissionsAsync()
if (status !== 'granted') {
  // Afficher un message expliquant pourquoi la localisation est nécessaire
  // Proposer d'ouvrir les paramètres avec Linking.openSettings()
}
```

---

### Composant : `components/map/PointMarker.tsx`

**Compléter le composant existant :**
- Couleur du pin selon la note :
  - 1-3 : `#f44336` (rouge)
  - 4-6 : `#ff9800` (orange)
  - 7-8 : `#8bc34a` (vert clair)
  - 9-10 : `#4caf50` (vert)
- `onPress` → ouvre un bottom sheet (ou Modal) avec le résumé du point :
  - Note affichée en étoiles (★)
  - Commentaire (tronqué à 100 chars)
  - Durée formatée ("45 min")
  - Date formatée ("Il y a 3 jours")
  - Boutons : "Voir détail" → `/(app)/point/[id]` | "Supprimer" (si creator)

---

### Composant : `components/map/HeatmapLayer.tsx`

**Implémenter la heatmap :**
```typescript
// Utiliser le composant Heatmap de react-native-maps
import { Heatmap } from 'react-native-maps'

// Chaque point a un weight basé sur sa note (note / 10)
const heatmapPoints = points.map(p => ({
  latitude: p.latitude,
  longitude: p.longitude,
  weight: p.note / 10,
}))

// Gradient rose/violet cohérent avec l'identité visuelle
const gradient = {
  colors: ['#9c27b0', '#e91e8c', '#ff5722'],
  startPoints: [0.1, 0.5, 1.0],
  colorMapSize: 256,
}
```

---

### Écran : `app/(app)/map/index.tsx`

**Comportement attendu :**
- Plein écran avec la carte
- En haut : toggle "Pins / Heatmap" (Segmented Button React Native Paper)
- Bouton FAB (Floating Action Button) en bas à droite : "+" → navigate vers `point/new` avec les coordonnées du centre de la carte en params
- Au montage : appeler `usePoints().fetchMyPoints(userId)` + charger les points des amis
- Afficher `PointMarker` pour chaque point en mode "pins"
- Afficher `HeatmapLayer` en mode "heatmap"
- Loading state : ActivityIndicator centré sur la carte

**Chargement des points des amis :**
```typescript
// Requête Supabase — la RLS filtre automatiquement ce qui est visible
const { data } = await supabase
  .from('points')
  .select('*')
  // Pas besoin de filtrer : RLS renvoie uniquement les points autorisés
```

---

### Composant : `components/point/PointForm.tsx`

**Formulaire de création/édition d'un point :**

Champs :
- **Note** : Slider de 1 à 10 avec valeur affichée (ou 10 étoiles tappables)
- **Durée** : Input numérique (minutes) avec label "Durée (minutes)"
- **Commentaire** : TextInput multiline, max 500 caractères, compteur affiché
- **Partenaire** (optionnel) : Champ de recherche d'utilisateur
  - L'utilisateur tape un username → appelle `search_users(query)` via RPC Supabase
  - Affiche une liste de résultats (avatar + username + display_name)
  - Sélection → stocke l'ID du partenaire
  - Bouton X pour désélectionner
- Bouton "Enregistrer le point"

Props :
```typescript
interface PointFormProps {
  latitude: number
  longitude: number
  initialData?: Partial<MapPoint>  // pour l'édition
  onSubmit: (data: PointFormData) => Promise<void>
  onCancel: () => void
}
```

---

### Écran : `app/(app)/point/new.tsx`

- Récupère `latitude` et `longitude` depuis les searchParams (`useLocalSearchParams`)
- Affiche une minimap non-interactive centré sur le point (MapView avec `scrollEnabled={false}`)
- En dessous : `PointForm`
- À la soumission :
  1. Appeler `usePoints().createPoint(...)` → obtenir le `pointId`
  2. Si un partenaire est sélectionné → insérer dans `point_partners`
  3. Envoyer une notification push au partenaire (via Supabase Edge Function ou direct via Expo Push API)
  4. Navigate back vers la carte avec un Snackbar "Point créé !"

---

### Écran : `app/(app)/point/[id].tsx`

- Affiche tous les détails du point
- Si `creator_id === currentUser.id` : boutons Modifier + Supprimer
- Si l'utilisateur est le partenaire tagué et `status === 'pending'` : boutons "Accepter" + "Refuser" le taguage
- Carte miniature non-interactive centrée sur le point
- Section partenaire : avatar + username + statut du consentement

---

## PHASE 3 — Heatmap (voir composant HeatmapLayer.tsx ci-dessus)

Activer/désactiver via le toggle dans `map/index.tsx`. Le composant est déjà décrit en Phase 2.

---

## PHASE 4 — Système d'amis

### Écran : `app/(app)/friends/index.tsx`

**Deux sections :**

1. **Recherche** : Input de recherche en haut, appelle `supabase.rpc('search_users', { query })` après 300ms de debounce. Affiche les résultats avec un bouton "Ajouter" (si pas déjà ami).

2. **Mes amis** : Liste des amis acceptés avec `FriendItem`. Bouton "Demandes reçues" avec badge si > 0.

---

### Composant : `components/friends/FriendItem.tsx`

Props : `friend: FriendWithProfile`, `onUnfriend: () => void`

Affiche : avatar (initiales si pas d'image) + display_name + @username + bouton "Retirer" (avec confirmation)

---

### Écran : `app/(app)/friends/requests.tsx`

**Deux listes :**
- Demandes reçues : `FriendRequestItem` avec boutons "Accepter" / "Refuser"
- Demandes envoyées : liste simple avec statut + bouton "Annuler"

---

### Composant : `components/friends/FriendRequestItem.tsx`

Props : `request: FriendWithProfile`, `onAccept: () => void`, `onReject: () => void`

---

## PHASE 5 — Taguage partenaire & Consentement

Déjà partiellement intégré dans `PointForm` (Phase 2). Compléter :

**Logique de consentement dans `point/[id].tsx` :**
```typescript
// Accepter le taguage
await supabase
  .from('point_partners')
  .update({ status: 'accepted', responded_at: new Date().toISOString() })
  .eq('id', partnerRecordId)
// Le trigger update_point_visibility() rend is_visible = TRUE automatiquement

// Refuser le taguage
await supabase
  .from('point_partners')
  .update({ status: 'rejected', responded_at: new Date().toISOString() })
  .eq('id', partnerRecordId)
// Le point reste is_visible = FALSE
```

**Notification à envoyer lors du taguage :**
```typescript
// Récupérer le push_token du partenaire depuis profiles
// Appeler l'API Expo Push :
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: partnerPushToken,
    title: 'LoveMap — Vous avez été tagué',
    body: `${currentUserDisplayName} vous a tagué sur un point. Acceptez-vous ?`,
    data: { pointId, type: 'partner_tag' },
  })
})
```

---

## PHASE 6 — Notifications Push

### Dans `app/(app)/_layout.tsx` ou `app/_layout.tsx` (après connexion)

```typescript
useEffect(() => {
  if (!user) return
  registerForPushNotificationsAsync().then(token => {
    if (token) savePushToken(user.id, token)
  })

  // Écouter les notifications reçues en foreground
  const sub = Notifications.addNotificationReceivedListener(notification => {
    const { type, pointId } = notification.request.content.data
    if (type === 'partner_tag') {
      // Afficher un Snackbar ou badge
    }
  })

  // Écouter les taps sur notification (app en background)
  const sub2 = Notifications.addNotificationResponseReceivedListener(response => {
    const { type, pointId } = response.notification.request.content.data
    if (type === 'partner_tag') router.push(`/(app)/point/${pointId}`)
    if (type === 'friend_request') router.push('/(app)/friends/requests')
  })

  return () => { sub.remove(); sub2.remove() }
}, [user])
```

---

## PHASE 7 — Profil & Paramètres

### Écran : `app/(app)/profile/index.tsx`

**Sections :**
1. Header : avatar (initiales colorées) + display_name + @username
2. Statistiques :
   - Nombre total de points
   - Note moyenne (calculée côté client depuis le store)
   - Nombre d'amis
3. Mini carte personnelle : `AppMapView` non-interactive avec uniquement ses propres points
4. Bouton "Modifier le profil" → inline edit du display_name et avatar_url

---

### Écran : `app/(app)/profile/settings.tsx`

**Options :**
- Changer le mot de passe : `supabase.auth.updateUser({ password: newPassword })`
- Se déconnecter : `useAuth().signOut()` → navigate vers `/(auth)/login`
- Supprimer le compte :
  1. Confirmation via Alert avec texte "SUPPRIMER" à taper
  2. Appeler une Supabase Edge Function `delete-account` (à créer) qui appelle `supabase.auth.admin.deleteUser(userId)` côté serveur
  3. Reset du store + navigate vers age-gate

---

## PHASE 8 — Sécurité

Checklist à vérifier avant de terminer :

- [ ] Aucun appel Supabase dans les composants — tout passe par les hooks
- [ ] La `SUPABASE_SERVICE_KEY` n'est jamais présente côté client
- [ ] Tous les inputs sont sanitisés (pas d'injection possible dans `search_users`)
- [ ] Les routes `(app)/` redirigent vers login si session nulle
- [ ] Le push token n'est jamais exposé à d'autres utilisateurs (la RLS profiles_select doit exclure le push_token des requêtes entre amis — **vérifier et corriger si nécessaire**)
- [ ] La date de naissance n'est jamais retournée dans `search_users`
- [ ] Les points `is_visible = FALSE` ne sont jamais retournés pour un utilisateur non-créateur (tester avec un second compte)

**Correction RLS profiles — exclure push_token des requêtes entre amis :**
```sql
-- Créer une vue sécurisée pour exposer les profils publics
CREATE VIEW public_profiles AS
SELECT id, username, display_name, avatar_url
FROM profiles;
```
Ou utiliser une colonne-level security si disponible sur le plan Supabase.

---

## PHASE 9 — Déploiement EAS

### `eas.json` à créer à la racine :
```json
{
  "cli": { "version": ">= 10.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Commandes de build :
```bash
# iOS (TestFlight)
eas build --platform ios --profile production

# Android (Play Store Internal)
eas build --platform android --profile production

# Les deux simultanément
eas build --platform all --profile production
```

---

## Contraintes de sécurité absolues (à ne jamais violer)

1. **Ne jamais** utiliser la Supabase Service Role Key côté client React Native
2. **Ne jamais** désactiver RLS sur une table, même temporairement pour déboguer
3. **Ne jamais** afficher le champ `push_token` d'un autre utilisateur dans l'interface
4. **Ne jamais** afficher le champ `date_of_birth` d'un autre utilisateur
5. **Toujours** vérifier que `creator_id === auth.uid()` avant d'autoriser une modification
6. Le système de consentement (`is_visible`) doit rester géré par le trigger SQL — ne pas ajouter de logique client qui le bypass

---

## Ordre d'implémentation recommandé

1. Phase 1 : age-gate → register → login → layout (app)
2. Phase 2 : AppMapView → MapScreen → PointForm → NewPoint → PointDetail → PointMarker
3. Phase 3 : HeatmapLayer + toggle dans MapScreen
4. Phase 4 : FriendItem → FriendRequestItem → FriendsScreen → FriendRequests
5. Phase 5 : Compléter PointDetail (consentement) + notifications taguage
6. Phase 6 : Push notifications dans le layout
7. Phase 7 : ProfileScreen → SettingsScreen
8. Phase 8 : Audit sécurité
9. Phase 9 : eas.json + build

---

## Variables d'environnement requises

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...  (Android uniquement)
```

---

## Commande d'initialisation (si le scaffold n'est pas encore installé)

```bash
npx create-expo-app@latest lovemap --template default
cd lovemap
npx expo install expo-router react-native-safe-area-context react-native-screens expo-location expo-notifications expo-device expo-secure-store
npm install @supabase/supabase-js @react-native-async-storage/async-storage zustand react-native-paper react-native-maps
```

---

*Fin du prompt — implémenter phase par phase, valider le comportement avant de passer à la suivante.*

# LoveMap

Application mobile React Native (Expo) pour adultes — carte interactive de points géolocalisés avec système de consentement et d'amis.

## Stack

- **Framework** : React Native + Expo SDK 51
- **Langage** : TypeScript strict
- **Backend** : Supabase (PostgreSQL + PostGIS + Auth + Realtime)
- **Cartes** : react-native-maps
- **State** : Zustand
- **Navigation** : Expo Router (file-based)
- **UI** : React Native Paper

## Installation

```bash
# 1. Cloner et installer
npm install

# 2. Copier et remplir les variables d'environnement
cp .env.local.example .env.local
# → Renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY

# 3. Initialiser la base Supabase
# → Exécuter supabase/migrations/001_initial_schema.sql dans le SQL Editor Supabase

# 4. Lancer
npx expo start
```

## Structure

```
app/          Expo Router — routes et layouts
components/   Composants réutilisables
hooks/        Logique métier (useAuth, usePoints, useFriends)
stores/       État global Zustand
lib/          Clients externes (Supabase, Notifications)
types/        Types TypeScript (database + métier)
constants/    Configuration globale
supabase/     Migrations SQL
```

## Phases de développement

| Phase | Feature |
|-------|---------|
| 0 | Initialisation & Infrastructure |
| 1 | Auth + Onboarding + Age Gate |
| 2 | Carte + Points |
| 3 | Heatmap |
| 4 | Système d'amis |
| 5 | Taguage partenaire + Consentement |
| 6 | Notifications Push |
| 7 | Profil & Paramètres |
| 8 | Audit sécurité |
| 9 | Déploiement EAS |

## Sécurité

- Toutes les tables ont RLS activé
- Les points sont privés par défaut (`is_visible = FALSE`)
- La visibilité n'est activée que par trigger après consentement du partenaire
- La date de naissance est vérifiée côté serveur (pas seulement côté client)
- Les données ne sont jamais exposées entre utilisateurs non-amis

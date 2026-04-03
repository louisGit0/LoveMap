# Changelog LoveMap — Session du 3 avril 2026

## 7 Features implémentées

### 1. Calendrier interactif (date picker)
- Remplacé les 3 champs manuels JJ/MM/YYYY par un `DatePickerModal` de `react-native-paper-dates`
- Locale française, impossible de sélectionner une date dans le futur
- **Fichiers modifiés** : `components/point/PointForm.tsx`, `app/_layout.tsx`
- **Dépendance ajoutée** : `react-native-paper-dates`

### 2. Partenaire obligatoire + édition par le partenaire
- La sélection d'un partenaire est maintenant **obligatoire** pour créer un point
- Le bouton "Enregistrer" est grisé tant qu'aucun partenaire n'est sélectionné
- Le partenaire tagué peut **modifier** le point (note, durée, date, commentaire) avant d'accepter ou refuser
- Mode édition in-place sur l'écran de détail du point
- **Fichiers modifiés** : `components/point/PointForm.tsx`, `app/(app)/point/new.tsx`, `app/(app)/point/[id].tsx`, `hooks/usePoints.ts`
- **Migration SQL** : `supabase/migrations/002_partner_edit.sql` — nouvelle policy RLS permettant au partenaire de modifier un point en attente

### 3. Photos sur les points + @ partenaire visible
- Ajout de photos (max 5) lors de la création d'un point
- Upload vers Supabase Storage bucket `point-photos`
- Affichage des photos en ScrollView horizontale sur le détail du point
- Badge @partenaire rose proéminent en haut du détail
- @partenaire affiché dans le bottom sheet des markers sur la carte
- **Fichiers créés** : `components/point/PhotoPicker.tsx`
- **Fichiers modifiés** : `components/point/PointForm.tsx`, `app/(app)/point/new.tsx`, `app/(app)/point/[id].tsx`, `hooks/usePoints.ts`, `types/app.types.ts`, `components/map/PointMarker.tsx`
- **Migration SQL** : `supabase/migrations/003_point_photos.sql` — nouvelle table `point_photos` avec RLS

### 4. Adresse sur les points (reverse geocoding)
- Reverse geocoding automatique via `expo-location` quand on place/déplace le marker
- Adresse stockée en base de données (colonne `address` sur `points`)
- Affichée dans le formulaire de création, le détail du point et le bottom sheet des markers
- **Fichiers modifiés** : `app/(app)/point/new.tsx`, `components/point/PointForm.tsx`, `hooks/usePoints.ts`, `app/(app)/point/[id].tsx`, `components/map/PointMarker.tsx`
- **Migration SQL** : `supabase/migrations/004_point_address.sql` — `ALTER TABLE points ADD COLUMN address TEXT`

### 5. Barre en haut plus clean (MapHeader)
- Remplacement du `SegmentedButtons` brut par un composant `MapHeader` custom
- Toggle Pins/Heatmap en pills arrondies avec icônes MaterialCommunityIcons
- Active = fond rose `#e91e8c`, inactive = transparent
- Safe area aware via `useSafeAreaInsets`
- Shadow/elevation subtile
- Slot gauche prévu pour le sélecteur d'ami
- **Fichiers créés** : `components/map/MapHeader.tsx`
- **Fichiers modifiés** : `app/(app)/map/index.tsx`

### 6. Section points triés par date
- Nouvel écran `point/list.tsx` avec `SectionList` groupée par mois/année
- Composant `PointListItem` réutilisable avec badge note coloré, date, commentaire, @partenaire, adresse
- Lien "Voir tout >" depuis la page profil
- **Fichiers créés** : `app/(app)/point/list.tsx`, `components/point/PointListItem.tsx`
- **Fichiers modifiés** : `app/(app)/_layout.tsx`, `app/(app)/profile/index.tsx`

### 7. Consulter la carte de ses amis
- Bouton 👥 dans le header de la carte ouvrant un bottom sheet avec la liste des amis
- Sélection d'un ami → la carte affiche ses points visibles
- FAB et long press masqués en mode ami (pas de création sur la carte d'un autre)
- Bannière "Carte de {nom}" avec bouton fermer
- Retour à "Ma carte" via le sélecteur ou la bannière
- **Fichiers créés** : `components/map/FriendSelector.tsx`
- **Fichiers modifiés** : `app/(app)/map/index.tsx`, `hooks/usePoints.ts`, `stores/mapStore.ts`

---

## Migrations SQL à exécuter sur Supabase

Aller dans Supabase Dashboard > SQL Editor et exécuter dans l'ordre :

### Migration 002 — Policy partner edit
```sql
CREATE POLICY "points_update_partner" ON points FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM point_partners
      WHERE point_partners.point_id = points.id
        AND point_partners.partner_id = auth.uid()
        AND point_partners.status = 'pending'
    )
  );
```

### Migration 003 — Table point_photos
```sql
CREATE TABLE point_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id   UUID NOT NULL REFERENCES points(id) ON DELETE CASCADE,
  photo_url  TEXT NOT NULL,
  position   SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE point_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "point_photos_select" ON point_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM points WHERE points.id = point_photos.point_id
        AND (
          points.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM point_partners
            WHERE point_partners.point_id = points.id
              AND point_partners.partner_id = auth.uid()
          )
          OR (points.is_visible = TRUE AND EXISTS (
            SELECT 1 FROM friendships WHERE status = 'accepted'
              AND ((requester_id = auth.uid() AND addressee_id = points.creator_id)
                OR (addressee_id = auth.uid() AND requester_id = points.creator_id))
          ))
        )
    )
  );

CREATE POLICY "point_photos_insert" ON point_photos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM points WHERE points.id = point_photos.point_id AND points.creator_id = auth.uid())
  );

CREATE POLICY "point_photos_delete" ON point_photos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM points WHERE points.id = point_photos.point_id AND points.creator_id = auth.uid())
  );
```

### Migration 004 — Colonne address
```sql
ALTER TABLE points ADD COLUMN address TEXT;
```

---

## Bucket Storage à créer

Aller dans Supabase Dashboard > Storage > New bucket :
- **Nom** : `point-photos`
- **Public** : oui

---

## Configuration Android native (GoogleMaps)

Clé Google Maps ajoutée dans `android/app/src/main/AndroidManifest.xml` :
```xml
<meta-data android:name="com.google.android.geo.API_KEY" android:value="..."/>
```

## Autres modifications

- **`eas.json`** : ajout `buildType: "apk"` pour dev et preview, `NPM_CONFIG_LEGACY_PEER_DEPS=true`
- **`.npmrc`** : `legacy-peer-deps=true` pour résoudre les conflits de peer dependencies
- **`app.json`** : `runtimeVersion` changé de `{ policy: "appVersion" }` à `"1.0.0"` (requis pour bare workflow)
- **`android/app/build.gradle`** : namespace corrigé de `com.lovemap` à `com.lovemap.app`
- **Assets** : icônes et splash régénérés à la bonne taille (1024x1024 et 1284x2778)
- **`.env.local`** : fichier créé avec les clés Supabase et Google Maps

---

## Nouveaux fichiers créés

| Fichier | Description |
|---------|-------------|
| `components/point/PhotoPicker.tsx` | Sélecteur de photos horizontal (max 5) |
| `components/point/PointListItem.tsx` | Row item pour la liste de points |
| `components/map/MapHeader.tsx` | Header carte avec pills toggle |
| `components/map/FriendSelector.tsx` | Bottom sheet sélecteur d'ami |
| `app/(app)/point/list.tsx` | Écran liste de tous les points par mois |
| `supabase/migrations/002_partner_edit.sql` | Policy RLS partner edit |
| `supabase/migrations/003_point_photos.sql` | Table point_photos + RLS |
| `supabase/migrations/004_point_address.sql` | Colonne address |
| `.npmrc` | Config npm legacy-peer-deps |

---

## Checklist de test

| Feature | Comment tester |
|---------|---------------|
| Calendrier | Créer un point → champ date = calendrier interactif |
| Partenaire obligatoire | Créer un point → bouton grisé sans partenaire |
| Edition partenaire | 2ème compte tagué → boutons Modifier/Accepter/Refuser |
| Photos | Créer un point → section Photos avec bouton + |
| Adresse | Créer un point → adresse affichée sous la carte |
| Header clean | Carte → toggle pills roses Pins/Heatmap |
| Liste points | Profil → "Voir tout >" → liste groupée par mois |
| Carte amis | Carte → bouton 👥 → sélectionner un ami |

> **Note** : Pour tester partenaire et carte amis, il faut 2 comptes qui sont amis entre eux.

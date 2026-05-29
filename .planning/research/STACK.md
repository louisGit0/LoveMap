# Stack & Carte Research

> Recherche technique pour LoveMap — React Native + Expo SDK 54, `@rnmapbox/maps` **10.3.1** (mobile uniquement, stubs web).
> Objectifs : (1) style Mapbox custom noir/rose, (2) clustering des points proches, (3) raffinement du heatmap.
> État actuel du code : `AppMapView.tsx` utilise `styleURL={APP_CONFIG.MAPBOX_STYLE}` (= `mapbox://styles/mapbox/dark-v11`), `PointMarker.tsx` rend **un `PointAnnotation` par point** avec une vue RN custom (pas de SVG), `HeatmapLayer.tsx` utilise déjà `ShapeSource` + `HeatmapLayer`.
> Token public initialisé via `MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN)`.

Date : 2026-05-29. Toutes les API ci-dessous ont été vérifiées contre la doc officielle rnmapbox (`rnmapbox.github.io/docs`) et Mapbox (`docs.mapbox.com`) à cette date. Les points non vérifiables sont explicitement marqués **[NON VÉRIFIÉ]**.

---

## Custom Mapbox Style

### Création dans Mapbox Studio

1. Mapbox Studio → **New style** → partir de `Dark` (base la plus proche du rendu actuel `dark-v11`) ou d'un template `Blank`/`Monochrome` pour un contrôle total.
2. Éditer la palette : fond `#000000`/`#0a0a0a` (cohérent avec `T.bg`), eau/relief en gris très sombres, accent rose `#ff2d87` (= `COLORS.primary`) réservé aux éléments de marque (pas au fond de carte, qui doit rester neutre pour ne pas écraser pins/heatmap).
3. **Publier** le style → Studio génère une `styleURL` de la forme `mapbox://styles/<username>/<styleId>`.
4. Récupérer cette URL et l'injecter via la variable d'env existante `EXPO_PUBLIC_MAPBOX_STYLE` — **aucun changement de code requis** dans `AppMapView.tsx`, qui lit déjà `APP_CONFIG.MAPBOX_STYLE`.

```ts
// .env.local — seul changement nécessaire pour activer le style custom
EXPO_PUBLIC_MAPBOX_STYLE=mapbox://styles/louis/clxxxxxxx000001abcd1234
```

### Labels minimaux

Deux approches, par ordre de robustesse :

- **(Recommandé) Dans Studio** : masquer/supprimer directement les couches de labels superflues dans l'éditeur (POI labels, transit, parfois place labels secondaires). Ne garder que les noms de villes/quartiers en typo discrète. C'est la méthode la plus fiable car la décision est figée côté style — rien à gérer au runtime. La doc Mapbox confirme : « create a custom style in Mapbox Studio… make the desired changes in the style editor and load the custom style ».
- **[NON VÉRIFIÉ pour rnmapbox 10.3.1]** Les toggles runtime `showPointOfInterestLabels` / `showPlaceLabels` / `showRoadLabels` existent pour le **style Mapbox Standard** (nouvelle génération). Le style `dark-v11` actuel n'est PAS Standard ; ces props ne s'appliquent pas de façon garantie via rnmapbox 10.3.1. **Ne pas compter dessus** — masquer les labels dans Studio.

### Token & permissions

- Un style custom **privé** (par défaut) reste lisible par n'importe quel token public `pk.*` du même compte — le token utilisé (`EXPO_PUBLIC_MAPBOX_TOKEN`, déjà en place) doit avoir le scope **`styles:read`** (présent par défaut sur les tokens publics). **Confiance : High.**
- Distinction importante à ne pas confondre avec le `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (`sk.*`) documenté dans `CLAUDE.md` : celui-ci sert **uniquement** au téléchargement du SDK natif pendant le build EAS, **pas** au chargement du style à l'exécution. Le style custom au runtime utilise le `pk.*`.
- **Gotcha historique** (Issue #839, *« Clustering is not working with custom styles »*) : reporté en 2020, **fermé** faute de repro confirmée. Pas de cause racine documentée ; le même style fonctionnait en natif Swift. À traiter comme un risque résiduel de bas niveau, pas comme un bug actif. **Confiance : Medium** (impossible de garantir 0 régression sur 10.3.1 sans test réel sur device).

---

## Clustering

### Principe & tradeoff vs `PointAnnotation`

Le clustering rnmapbox **exige** une source GeoJSON (`ShapeSource cluster={true}`) rendue par des **style layers** (`CircleLayer` + `SymbolLayer`). Il est **incompatible** avec l'approche actuelle « un `PointAnnotation` par point » : les `PointAnnotation` sont des vues RN/UIView individuelles, hors du pipeline de tuilage Mapbox, donc le moteur de clustering ne les voit pas.

**Tradeoff à aceverer :**

| Aspect | `PointAnnotation` (actuel) | `ShapeSource` + `CircleLayer`/`SymbolLayer` (clustering) |
|---|---|---|
| Clustering natif | ❌ impossible | ✅ natif (supercluster intégré) |
| Perf many points iOS | ⚠️ chute de framerate avec child custom (Issue #1309) | ✅ rendu GPU, recommandé par la doc |
| Marqueur = vue RN arbitraire | ✅ (le `PinIcon` actuel) | ❌ — uniquement cercles/symboles stylés par expressions, ou icône PNG/SDF via `iconImage` |
| Tap → bottom sheet | ✅ via `onSelected` | ✅ via `onPress` sur le `ShapeSource` (event.features) |

**Conséquence design** : le look « pin » custom actuel (`PinIcon` : tête cerclée + tige) **ne peut pas être conservé tel quel** dans une couche stylée. Deux options pour rester fidèle à l'identité noir/rose :

1. **CircleLayer pur** (le plus simple, recommandé pour un MVP clustering) : points individuels = petit cercle rose plein cerclé de noir ; clusters = cercle plus grand + `SymbolLayer` affichant `point_count`. Esthétique éditoriale francs/minimaliste, cohérente avec `cardRadius: 4` et l'usage du rose accent.
2. **Hybride** : `ShapeSource cluster` (clusters en CircleLayer) **+** garder les `PointAnnotation` uniquement aux zooms élevés (quand `point_count` n'existe plus). Plus complexe, perf dégradée — **déconseillé**.

> Recommandation : **migrer entièrement vers CircleLayer/SymbolLayer** pour les points sur la carte principale. Conserver `PointAnnotation` n'apporte que le look pin, au prix du clustering ET de la perf.

### API exacte (vérifiée doc ShapeSource)

Props de clustering sur `ShapeSource` :

- `cluster` : `boolean` — « Enables clustering on the source for point shapes. »
- `clusterRadius` : `number` — rayon de regroupement en px ; défaut **50** ; `512` = largeur d'une tuile.
- `clusterMaxZoomLevel` : `number` — zoom max au-delà duquel on ne cluster plus.
- `clusterProperties` : `object` — agrégats custom sur les clusters (ex. moyenne des notes).

> ⚠️ La prop rnmapbox s'appelle bien **`clusterMaxZoomLevel`** (et non `clusterMaxZoom`, qui est le nom Mapbox GL JS — certains articles tiers confondent les deux). Source : doc officielle ShapeSource.

Méthodes (sur la ref du `ShapeSource`) — **acceptent la feature cluster OU le cluster_id** (changement récent, OK en 10.3.1) :

- `getClusterExpansionZoom(feature: string | GeoJSON.Feature): Promise<number>`
- `getClusterLeaves(feature, limit, offset): Promise<FeatureCollection>`
- `getClusterChildren(feature): Promise<FeatureCollection>`

Détection du tap : `onPress` du `ShapeSource` reçoit `{ features: Feature[], coordinates, point }`. Un cluster est une feature dont `properties.point_count` (et `properties.cluster === true`) existe.

### Pattern de code concret

```tsx
// components/map/PointsClusterLayer.tsx
import React, { useRef, useMemo } from 'react';
import MapboxGL from '@rnmapbox/maps';
import type { MapPoint } from '@/types/app.types';

interface Props {
  points: MapPoint[];
  cameraRef: React.RefObject<MapboxGL.Camera>;
  onSelectPoint: (pointId: string) => void; // ouvre le bottom sheet existant
}

export function PointsClusterLayer({ points, cameraRef, onSelectPoint }: Props) {
  const shapeRef = useRef<MapboxGL.ShapeSource>(null);

  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: points.map((p) => ({
        type: 'Feature' as const,
        id: p.id,
        geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
        properties: { pointId: p.id, note: p.note },
      })),
    }),
    [points],
  );

  async function handlePress(e: { features: any[]; coordinates: any }) {
    const feature = e.features?.[0];
    if (!feature) return;

    // Cas cluster : zoomer pour l'éclater
    if (feature.properties?.point_count != null) {
      const zoom = await shapeRef.current?.getClusterExpansionZoom(feature);
      if (zoom != null) {
        cameraRef.current?.setCamera({
          centerCoordinate: feature.geometry.coordinates,
          zoomLevel: zoom,
          animationDuration: 500,
          animationMode: 'flyTo',
        });
      }
      return;
    }

    // Cas point individuel : ouvrir le détail
    if (feature.properties?.pointId) onSelectPoint(feature.properties.pointId);
  }

  if (points.length === 0) return null;

  return (
    <MapboxGL.ShapeSource
      ref={shapeRef}
      id="points-source"
      shape={geojson}
      cluster
      clusterRadius={50}
      clusterMaxZoomLevel={14}
      onPress={handlePress as any}
    >
      {/* Cercle des clusters (point_count présent) */}
      <MapboxGL.CircleLayer
        id="cluster-circles"
        filter={['has', 'point_count']}
        style={{
          circleColor: '#ff2d87',
          circleOpacity: 0.9,
          circleStrokeColor: '#000000',
          circleStrokeWidth: 1.5,
          circleRadius: [
            'step',
            ['get', 'point_count'],
            16,   // < 10 points
            10, 22,
            50, 30,
          ],
        }}
      />

      {/* Compteur des clusters */}
      <MapboxGL.SymbolLayer
        id="cluster-count"
        filter={['has', 'point_count']}
        style={{
          textField: ['get', 'point_count_abbreviated'],
          textSize: 13,
          textColor: '#000000',
          textIgnorePlacement: true,
          textAllowOverlap: true,
        }}
      />

      {/* Points individuels (pas de point_count) */}
      <MapboxGL.CircleLayer
        id="single-point"
        filter={['!', ['has', 'point_count']]}
        style={{
          circleColor: '#ff2d87',
          circleRadius: 7,
          circleStrokeColor: '#000000',
          circleStrokeWidth: 2,
        }}
      />
    </MapboxGL.ShapeSource>
  );
}
```

Notes d'intégration :
- `point_count_abbreviated` est fourni automatiquement par le moteur de clustering (ex. `1,2k`). `point_count` brut est dispo aussi.
- Passer `cameraRef` depuis `AppMapView` (déjà existant) ou exposer une méthode. Le `<children>` de la `MapView` permet déjà d'insérer ce composant à la place de la liste de `PointMarker`.
- Conserver le **bottom sheet** existant de `PointMarker.tsx` en l'extrayant en composant contrôlé (state `selectedPointId` remonté au screen `map/index.tsx`), puisque le `CircleLayer` ne peut plus héberger la `Modal` RN.
- `clusterProperties` peut agréger la note moyenne si on veut colorer les clusters par intensité plus tard (ex. `clusterProperties={{ noteSum: ['+', ['get','note']] }}`).

**Confiance API clustering : High** (props/méthodes/filtres vérifiés sur doc officielle). **Confiance snippet exact : Medium** — le typage TS de rnmapbox force souvent `as any` sur `style`/`onPress` (déjà le cas dans le code existant) ; à tester sur device.

---

## Heatmap

L'implémentation actuelle (`HeatmapLayer.tsx`) est **déjà correcte dans sa structure** : `ShapeSource` + `HeatmapLayer`, `heatmapWeight` data-driven sur `['get','weight']`, `heatmapColor` via `interpolate`/`heatmap-density`, `heatmapRadius`/`heatmapIntensity` zoom-driven. Le raffinement porte surtout sur le **gradient** et la cohérence avec la palette rose.

### Propriétés (vérifiées Mapbox style-spec)

| Propriété (rnmapbox camelCase) | Défaut Mapbox | Zoom-expr | Data-driven | Notes |
|---|---|---|---|---|
| `heatmapColor` | gradient bleu→rouge | ✅ | ❌ | **DOIT** utiliser `['heatmap-density']` en entrée ; input 0..1 ; **doit commencer à `0` avec une couleur transparente** sinon tout l'écran se teinte. |
| `heatmapWeight` | `1` | ❌ | ✅ | poids par feature — idéal pour `note/10`. **Pas** d'expression `['zoom']` ici. |
| `heatmapIntensity` | `1` | ✅ | ❌ (global) | multiplicateur global, monter avec le zoom. |
| `heatmapRadius` | `30` px | ✅ | ✅ | rayon d'influence ; monter avec le zoom. |
| `heatmapOpacity` | `1` | ✅ | ❌ (global) | |

> Contrainte clé confirmée : `heatmap-color` n'est **pas** data-driven (impossible de varier la couleur par feature) et doit **impérativement** être une `interpolate` sur `['heatmap-density']` avec un premier stop `0 → transparent`.

### Gradient rose/chaud recommandé

Gradient noir-transparent → rose profond → rose vif → corail/ambre, cohérent avec `#ff2d87` :

```tsx
heatmapColor: [
  'interpolate',
  ['linear'],
  ['heatmap-density'],
  0.0, 'rgba(0,0,0,0)',        // transparent obligatoire au stop 0
  0.15, 'rgba(120,20,80,0.5)', // rose très sombre (faible densité)
  0.40, 'rgba(169,24,96,0.8)', // T.danger-ish
  0.65, '#ff2d87',             // T.primary — cœur rose
  0.85, '#ff5a9e',             // rose clair
  1.0, '#ffb347',              // ambre chaud (pics)
]
```

Réglages d'accompagnement (affinent l'actuel) :

```tsx
heatmapWeight: ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1], // note/10, inchangé — OK
heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 9, 0.6, 13, 1.2, 16, 2.0],
heatmapRadius: ['interpolate', ['linear'], ['zoom'], 9, 14, 13, 30, 16, 55],
heatmapOpacity: ['interpolate', ['linear'], ['zoom'], 14, 0.85, 16, 0.4], // s'efface quand on zoome (laisse place aux pins)
```

Astuce UX classique : faire **décroître `heatmapOpacity`** aux zooms élevés pour passer en douceur du heatmap (vue macro) aux pins/clusters (vue micro). Combinable avec le toggle pins/heatmap existant (`MapHeader.tsx`).

**Confiance : High** sur les propriétés et la contrainte `heatmap-density`. Les valeurs exactes du gradient sont un choix esthétique à ajuster visuellement.

---

## Compatibility Gotchas

1. **`PointAnnotation` + child custom = chute de framerate iOS** — Issue #1309 (ouverte, reproduite sur iOS). Le `PinIcon` actuel (vue RN dans `PointAnnotation`) est exactement ce cas. La doc rnmapbox recommande explicitement `ShapeSource` + style layers « for many points… much better performance than PointAnnotation ». **→ Argument fort pour la migration clustering. Confiance : High.**

2. **`clusterMaxZoomLevel` vs `clusterMaxZoom`** — la prop rnmapbox est `clusterMaxZoomLevel`. Plusieurs tutoriels tiers utilisent `clusterMaxZoom` (nom Mapbox GL JS) qui sera silencieusement ignoré. **Confiance : High.**

3. **Clustering + style custom (Issue #839)** — historique (2020), fermé sans repro. Risque résiduel faible mais non nul. **Tester le clustering sur le style custom réel, sur device iOS**, pas seulement simulateur. **Confiance : Medium.**

4. **`getClusterExpansionZoom` historiquement instable sur iOS v10** (Issue #2001 — *« throws error »*). Vérifié : l'API accepte désormais la **feature** OU le `cluster_id`. En 10.3.1, passer la **feature complète** (comme dans le snippet) est le chemin le plus sûr. Toujours `await` + null-check le retour. **Confiance : Medium** — à valider sur device.

5. **Typage TS rnmapbox** — `style` des layers et `onPress`/`onCameraChanged` requièrent souvent `as any` (déjà présent dans `AppMapView.tsx` et `HeatmapLayer.tsx`). Pattern accepté ici ; conserver. **Confiance : High.**

6. **Clusters invisibles au simulateur iOS** (Discussion #3549) — symptômes de rendu sur simulateur uniquement. **Toujours valider sur device physique** avant conclusion. **Confiance : Medium.**

7. **`heatmapColor` mal initialisé** — si le stop 0 n'est pas transparent, toute la carte se teinte. L'actuel respecte déjà cette règle (`'rgba(0,0,0,0)'` à 0). **Confiance : High.**

8. **Web** — `@rnmapbox/maps` est stubé sur web (`rnmapbox-maps.web.js`, `metro.config.js`). Clustering/heatmap/style custom sont **mobile-only** ; les nouveaux composants doivent avoir un stub `.web.tsx` retournant `null`, comme `HeatmapLayer.web.tsx`/`PointMarker.web.tsx`. **Confiance : High.**

---

## Recommendations (with confidence)

1. **Style custom** : créer le style dans Studio (base Dark, labels masqués dans l'éditeur), publier, injecter l'URL via `EXPO_PUBLIC_MAPBOX_STYLE`. **Zéro changement de code.** Le token `pk.*` actuel (scope `styles:read`) suffit. **Confiance : High.** Ne pas compter sur les toggles runtime `showPoiLabels` (réservés au style Standard, non garantis sur dark-v11). **[NON VÉRIFIÉ : runtime toggles sur 10.3.1]**

2. **Clustering** : migrer les points de `PointAnnotation` (un par point) vers **un seul `ShapeSource cluster` + `CircleLayer` (clusters & points) + `SymbolLayer` (`point_count`)**. Tap cluster → `getClusterExpansionZoom(feature)` + `camera.setCamera`. Tap point → remonter `pointId` au screen pour ouvrir le bottom sheet (extrait de `PointMarker.tsx`). Le look « pin » disparaît au profit de cercles rose/noir cohérents avec la charte. Gains : clustering natif **+** perf iOS. **Confiance : High** (API), **Medium** (intégration à tester sur device).

3. **Heatmap** : structure actuelle conservée ; remplacer uniquement le gradient par la rampe rose→ambre proposée et faire **décroître `heatmapOpacity` aux zooms élevés** pour la transition heatmap→pins/clusters. **Confiance : High.**

4. **Validation obligatoire sur device iOS physique** (pas simulateur) pour : clustering sur style custom (#839), `getClusterExpansionZoom` (#2001), rendu des clusters (#3549). Prévoir un stub `.web.tsx` pour tout nouveau composant carte. **Confiance : High** sur la nécessité du test.

### Sources

- [ShapeSource | @rnmapbox/maps](https://rnmapbox.github.io/docs/components/ShapeSource)
- [maps/docs/PointAnnotation.md](https://github.com/rnmapbox/maps/blob/main/docs/PointAnnotation.md)
- [MarkerView | @rnmapbox/maps](https://rnmapbox.github.io/docs/components/MarkerView)
- [Issue #1309 — PointAnnotation custom child perte de perf iOS](https://github.com/rnmapbox/maps/issues/1309)
- [Issue #839 — Clustering not working with custom styles](https://github.com/rnmapbox/maps/issues/839)
- [Issue #2001 — getClusterExpansionZoom throws (iOS v10)](https://github.com/rnmapbox/maps/issues/2001)
- [Discussion #3549 — Clusters not shown in iOS simulator](https://github.com/rnmapbox/maps/discussions/3549)
- [Mapbox style-spec — layers (heatmap)](https://docs.mapbox.com/style-spec/reference/layers/)
- [Mapbox GL JS — Create and style clusters](https://docs.mapbox.com/mapbox-gl-js/example/cluster/)
- [Mapbox Studio manual — Styles](https://docs.mapbox.com/studio-manual/reference/styles/)
- [Set a style | iOS | Mapbox](https://docs.mapbox.com/ios/maps/guides/styles/set-a-style/)
- [Tony Strawberry — Map clusters in RN Mapbox](https://tonystrawberry.hashnode.dev/displaying-a-map-with-clusters-in-react-native-using-mapbox)
- [DEV — rnmapbox/maps v10 usage](https://dev.to/ajmal_hasan/react-native-mapbox-v10-usage-4gbp)

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { APP_CONFIG } from '@/constants/config';
import { IcoTarget } from '@/components/icons';
import { UserLocationMarker } from '@/components/map/UserLocationMarker';
import { haptics } from '@/lib/haptics';
import type { Theme } from '@/constants/theme';

// Initialiser le token public Mapbox (clé pk.xxx depuis .env.local)
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string ?? '');

const PARIS: [number, number] = [2.3522, 48.8566]; // [longitude, latitude] — ordre GeoJSON
const DEFAULT_ZOOM = 12;
const DISTANCE_THRESHOLD = 0.1; // degrés ≈ 10 km

// Eau en bleu — recolore les calques d'eau du style Mapbox hosté par-dessus (source
// `composite`/mapbox-streets-v8, source-layers `water`/`waterway`, déjà présents dans le style).
const WATER_FILL = '#143a5e';   // mers / lacs (bleu nuit éditorial)
const WATERWAY_LINE = '#1f4e7a'; // rivières / canaux

interface Props {
  children?: React.ReactNode;
  onLongPress?: (coords: { latitude: number; longitude: number }) => void;
  onCenterChange?: (coords: { latitude: number; longitude: number }) => void;
  scrollEnabled?: boolean;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
  // Affiche le marqueur de position de l'utilisateur. Faux en mode « vue ami » :
  // on ne montre pas sa propre localisation actuelle quand on consulte la carte d'un ami.
  showUserLocation?: boolean;
  // Recentre la caméra sur ces coordonnées quand elles changent (ex. barycentre des points de l'ami).
  focusCoords?: { latitude: number; longitude: number } | null;
}

export function AppMapView({
  children,
  onLongPress,
  onCenterChange,
  scrollEnabled = true,
  initialRegion,
  showUserLocation = true,
  focusCoords = null,
}: Props) {
  const T = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(T), [T]);
  const cameraRef = useRef<MapboxGL.Camera>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [initialCenter] = useState<[number, number]>(
    initialRegion
      ? [initialRegion.longitude, initialRegion.latitude]
      : PARIS,
  );
  const [showRecenter, setShowRecenter] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      setUserCoords(coords);
      // Ne pas centrer automatiquement sur l'utilisateur en mode « vue ami »
      // (la caméra suit alors focusCoords = les points de l'ami).
      if (!initialRegion && showUserLocation) {
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: DEFAULT_ZOOM,
          animationDuration: 800,
          animationMode: 'flyTo',
        });
      }
    })();
  }, []);

  // Recentre sur focusCoords quand il change (mode « vue ami » → barycentre des points de l'ami).
  useEffect(() => {
    if (!focusCoords) return;
    cameraRef.current?.setCamera({
      centerCoordinate: [focusCoords.longitude, focusCoords.latitude],
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 700,
      animationMode: 'flyTo',
    });
  }, [focusCoords?.latitude, focusCoords?.longitude]);

  function handleCameraChanged(state: { properties: { center: [number, number] } }) {
    const [lng, lat] = state.properties.center;
    onCenterChange?.({ latitude: lat, longitude: lng });
    if (userCoords) {
      const dLat = Math.abs(lat - userCoords[1]);
      const dLng = Math.abs(lng - userCoords[0]);
      setShowRecenter(dLat > DISTANCE_THRESHOLD || dLng > DISTANCE_THRESHOLD);
    }
  }

  function handleLongPress(feature: { geometry: { type: string; coordinates: number[] } }) {
    if (feature?.geometry?.type === 'Point') {
      const [lng, lat] = feature.geometry.coordinates;
      onLongPress?.({ latitude: lat, longitude: lng });
    }
  }

  function handleRecenter() {
    if (!userCoords) return;
    haptics.tap();
    cameraRef.current?.setCamera({
      centerCoordinate: userCoords,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 600,
      animationMode: 'flyTo',
    });
    setShowRecenter(false);
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapboxGL.MapView
        style={StyleSheet.absoluteFillObject}
        styleURL={APP_CONFIG.MAPBOX_STYLE}
        scrollEnabled={scrollEnabled}
        onCameraChanged={handleCameraChanged as any}
        onLongPress={handleLongPress as any}
        compassEnabled={false}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={DEFAULT_ZOOM}
          centerCoordinate={initialCenter}
          animationMode="none"
          animationDuration={0}
        />
        {/* Eau en bleu — par-dessus les calques d'eau du style (juste au-dessus, sous routes/labels) */}
        <MapboxGL.FillLayer
          id="lm-water-blue"
          sourceID="composite"
          sourceLayerID="water"
          aboveLayerID="water"
          style={{ fillColor: WATER_FILL }}
        />
        <MapboxGL.LineLayer
          id="lm-waterway-blue"
          sourceID="composite"
          sourceLayerID="waterway"
          aboveLayerID="waterway"
          style={{ lineColor: WATERWAY_LINE }}
        />
        {/* Relevé blanc custom (sceau « le point ») — remplace le point bleu système */}
        {showUserLocation && userCoords && <UserLocationMarker coordinate={userCoords} />}
        {children}
      </MapboxGL.MapView>

      {showRecenter && showUserLocation && (
        <TouchableOpacity
          style={[styles.recenterButton, { bottom: insets.bottom + 144 }]}
          onPress={handleRecenter}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Recentrer sur ma position"
        >
          <IcoTarget size={20} color={T.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (T: Theme) =>
  StyleSheet.create({
    // Squircle 40×40 détaché, bas-droite, centré au-dessus du FAB (right:20, w:56)
    recenterButton: {
      position: 'absolute',
      right: 28,
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: T.surface + 'eb',
      borderWidth: 1,
      borderColor: T.border,
      borderRadius: T.radiusSm,
      borderCurve: 'continuous',
    },
  });

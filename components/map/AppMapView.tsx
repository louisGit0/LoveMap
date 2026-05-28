import React, { useRef, useState, useEffect, useMemo } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { APP_CONFIG } from '@/constants/config';
import type { Theme } from '@/constants/theme';

// Initialiser le token public Mapbox (clé pk.xxx depuis .env.local)
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string ?? '');

const PARIS: [number, number] = [2.3522, 48.8566]; // [longitude, latitude] — ordre GeoJSON
const DEFAULT_ZOOM = 12;
const DISTANCE_THRESHOLD = 0.1; // degrés ≈ 10 km

interface Props {
  children?: React.ReactNode;
  onLongPress?: (coords: { latitude: number; longitude: number }) => void;
  onCenterChange?: (coords: { latitude: number; longitude: number }) => void;
  scrollEnabled?: boolean;
  initialRegion?: { latitude: number; longitude: number; latitudeDelta?: number; longitudeDelta?: number };
}

export function AppMapView({
  children,
  onLongPress,
  onCenterChange,
  scrollEnabled = true,
  initialRegion,
}: Props) {
  const T = useTheme();
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
      if (!initialRegion) {
        cameraRef.current?.setCamera({
          centerCoordinate: coords,
          zoomLevel: DEFAULT_ZOOM,
          animationDuration: 800,
          animationMode: 'flyTo',
        });
      }
    })();
  }, []);

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
        <MapboxGL.UserLocation visible renderMode="native" />
        {children}
      </MapboxGL.MapView>

      {showRecenter && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.8}
        >
          <Text style={styles.recenterText}>Recentrer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (T: Theme) =>
  StyleSheet.create({
    recenterButton: {
      position: 'absolute',
      bottom: 100,
      alignSelf: 'center',
      backgroundColor: T.surface,
      borderWidth: 1,
      borderColor: T.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    recenterText: {
      fontFamily: F.mono,
      fontSize: 10,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: T.primary,
    },
  });

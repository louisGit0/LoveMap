import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Platform, TouchableOpacity, Text, View } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Linking } from 'react-native';

const PARIS = { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.05, longitudeDelta: 0.05 };
const DISTANCE_THRESHOLD = 0.1; // degrés — ~10 km

interface Props {
  children?: React.ReactNode;
  onLongPress?: (coords: { latitude: number; longitude: number }) => void;
  scrollEnabled?: boolean;
  initialRegion?: Region;
}

export function AppMapView({ children, onLongPress, scrollEnabled = true, initialRegion }: Props) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>(initialRegion ?? PARIS);
  const [showRecenter, setShowRecenter] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        // Pas de localisation — on reste sur Paris
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      if (!initialRegion) {
        const newRegion = { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 800);
      }
    })();
  }, []);

  function handleRegionChange(r: Region) {
    setRegion(r);
    if (userLocation) {
      const latDiff = Math.abs(r.latitude - userLocation.latitude);
      const lngDiff = Math.abs(r.longitude - userLocation.longitude);
      setShowRecenter(latDiff > DISTANCE_THRESHOLD || lngDiff > DISTANCE_THRESHOLD);
    }
  }

  function handleRecenter() {
    if (userLocation) {
      const newRegion = { ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 };
      mapRef.current?.animateToRegion(newRegion, 600);
      setShowRecenter(false);
    }
  }

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChange}
        onLongPress={(e) => onLongPress?.(e.nativeEvent.coordinate)}
        scrollEnabled={scrollEnabled}
        customMapStyle={darkMapStyle}
      >
        {children}
      </MapView>

      {showRecenter && (
        <TouchableOpacity style={styles.recenterButton} onPress={handleRecenter} activeOpacity={0.8}>
          <Text style={styles.recenterText}>📍 Recentrer</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e91e8c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  recenterText: {
    color: '#e91e8c',
    fontWeight: '600',
    fontSize: 13,
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
];

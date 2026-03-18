// TODO Phase 2 — Implémenté par Claude Code
// Wrapper react-native-maps avec gestion de la région et du style dark
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, Platform } from 'react-native';

interface Props {
  children?: React.ReactNode;
  onLongPress?: (coords: { latitude: number; longitude: number }) => void;
}

export function AppMapView({ children, onLongPress }: Props) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
      showsUserLocation
      showsMyLocationButton
      onLongPress={(e) => onLongPress?.(e.nativeEvent.coordinate)}
      customMapStyle={darkMapStyle}
    >
      {children}
    </MapView>
  );
}

// Style dark pour Google Maps (Android)
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
];

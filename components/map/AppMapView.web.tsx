import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '@/constants/theme';

interface Props {
  children?: React.ReactNode;
  onLongPress?: (coords: { latitude: number; longitude: number }) => void;
  onCenterChange?: (coords: { latitude: number; longitude: number }) => void;
  scrollEnabled?: boolean;
}

export function AppMapView({ children }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.icon}>🗺️</Text>
        <Text style={styles.label}>Carte disponible sur mobile</Text>
        <Text style={styles.sub}>Scannez le QR code avec Expo Go</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#0d1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    alignItems: 'center',
    gap: 10,
  },
  icon: { fontSize: 48 },
  label: { color: T.text, fontSize: 16, fontWeight: '600' },
  sub: { color: T.textDim, fontSize: 13 },
});

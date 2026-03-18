// TODO Phase 2 — Implémenté par Claude Code
// Détail et édition d'un point existant
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PointDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff' }}>Point {id} — À implémenter</Text>
    </View>
  );
}

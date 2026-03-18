// TODO Phase 2 — Implémenté par Claude Code
// Marqueur individuel sur la carte avec couleur selon la note
import { Marker } from 'react-native-maps';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
  onPress?: (point: MapPoint) => void;
}

export function PointMarker({ point, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: point.latitude, longitude: point.longitude }}
      onPress={() => onPress?.(point)}
      pinColor="#e91e8c"
    />
  );
}

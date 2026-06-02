import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
  /** Nombre de moments à ce même lieu (≥ 2 → pastille de compte sur le pin). */
  count?: number;
}

// Pastille de compte (plusieurs moments au même endroit) — en haut à droite du pin.
function CountBadge({ T, count }: { T: Theme; count: number }) {
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      right: 0,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: T.primary,
      borderWidth: 1.5,
      borderColor: T.bg,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: F.monoMedium, fontSize: 9, color: T.bg }}>{count}</Text>
    </View>
  );
}

/**
 * Pin View sans SVG — compatible PointAnnotation (rendu natif Mapbox, snapshot RN view).
 * Pin au repos raffiné (D-05) : tête 24, point intérieur 9, tige 8, point bas 4,
 * halo statique léger (capturé dans le snapshot, pas une transform animée).
 */
function PinIcon({ T, count }: { T: Theme; count?: number }) {
  return (
    <View style={{ width: 28, height: 36, alignItems: 'center' }}>
      {count && count > 1 ? <CountBadge T={T} count={count} /> : null}
      {/* Tête */}
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: T.bg,
        borderWidth: 2,
        borderColor: T.primary,
        alignItems: 'center',
        justifyContent: 'center',
        // Halo statique léger — figé dans le snapshot natif (pas d'animation)
        shadowColor: T.primary,
        shadowRadius: 6,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 0 },
      }}>
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: T.primary }} />
      </View>
      {/* Tige */}
      <View style={{ width: 2, height: 8, backgroundColor: T.primary }} />
      {/* Point bas */}
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.primary }} />
    </View>
  );
}

/**
 * Variante sélectionnée (D-06) : tête agrandie (~×1.25) + anneau halo rose derrière.
 * Rendue par RE-SNAPSHOT (toggle de variante + refresh()), JAMAIS par une transform
 * animée sur les enfants de PointAnnotation (le snapshot natif gèlerait l'animation).
 */
function PinIconSelected({ T, count }: { T: Theme; count?: number }) {
  return (
    <View style={{ width: 44, height: 56, alignItems: 'center' }}>
      {count && count > 1 ? <CountBadge T={T} count={count} /> : null}
      {/* Anneau halo + tête agrandie */}
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,45,135,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,45,135,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: T.bg,
          borderWidth: 2,
          borderColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: T.primary }} />
        </View>
      </View>
      {/* Tige */}
      <View style={{ width: 2, height: 8, backgroundColor: T.primary }} />
      {/* Point bas */}
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.primary }} />
    </View>
  );
}

export function PointMarker({ point, count }: Props) {
  const T = useTheme();
  const annRef = useRef<MapboxGL.PointAnnotation>(null);
  // Garde-fou anti-double-ouverture : `onSelected` peut se déclencher plusieurs fois pour un seul tap.
  const navigatingRef = useRef(false);

  // Re-snapshot après le montage : au 1er snapshot natif, le texte de la pastille n'est pas
  // toujours mis en page → la pastille de compte n'apparaîtrait pas. Un refresh différé la capture.
  useEffect(() => {
    const t = setTimeout(() => annRef.current?.refresh(), 60);
    return () => clearTimeout(t);
  }, [count]);

  /*
   * PointAnnotation (annotation native Mapbox) — toujours visible quel que soit le zoom.
   * `selected={false}` constant : on n'utilise PAS l'état sélectionné natif (qui « collait »
   * en halo rose et empêchait de re-taper le pin — quirk iOS). Le pin garde toujours le même
   * visuel (PinIcon), et chaque tap re-déclenche onSelected → ouverture fiable du détail.
   */
  return (
    <MapboxGL.PointAnnotation
      ref={annRef}
      id={point.id}
      coordinate={[point.longitude, point.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      selected={false}
      onSelected={() => {
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        router.push(`/(app)/point/${point.id}`);
        setTimeout(() => { navigatingRef.current = false; }, 600);
      }}
    >
      <PinIcon T={T} count={count} />
    </MapboxGL.PointAnnotation>
  );
}

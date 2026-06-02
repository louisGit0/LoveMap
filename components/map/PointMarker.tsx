import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
}

/**
 * Pin View sans SVG — compatible PointAnnotation (rendu natif Mapbox, snapshot RN view).
 * Pin au repos raffiné (D-05) : tête 24, point intérieur 9, tige 8, point bas 4,
 * halo statique léger (capturé dans le snapshot, pas une transform animée).
 */
function PinIcon({ T }: { T: Theme }) {
  return (
    <View style={{ width: 28, height: 36, alignItems: 'center' }}>
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
function PinIconSelected({ T }: { T: Theme }) {
  return (
    <View style={{ width: 44, height: 56, alignItems: 'center' }}>
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

export function PointMarker({ point }: Props) {
  const T = useTheme();
  const [selected, setSelected] = useState(false);
  const annRef = useRef<MapboxGL.PointAnnotation>(null);
  // Garde-fou anti-double-ouverture : `onSelected` peut se déclencher plusieurs fois
  // pour un seul tap (quirk iOS + re-snapshot via refresh()). On ne pousse la route
  // qu'une fois par sélection, réarmé au deselect ou après un court délai.
  const navigatingRef = useRef(false);

  // Sélection = re-snapshot (Pitfall 2) : refresh() obligatoire après le swap de variante.
  // Sans refresh(), un simple changement d'état React ne re-déclenche pas toujours le snapshot natif.
  useEffect(() => {
    annRef.current?.refresh();
  }, [selected]);

  // De retour sur la carte (le détail s'est fermé), réinitialiser la sélection.
  // Sinon l'annotation peut rester « selected » (onDeselected non déclenché — quirk iOS),
  // et re-taper un pin déjà sélectionné ne re-déclenche PAS onSelected → le détail ne s'ouvre pas.
  useFocusEffect(
    useCallback(() => {
      setSelected(false);
      navigatingRef.current = false;
    }, [])
  );

  return (
    /*
     * PointAnnotation (annotation native Mapbox) — toujours visible quel que soit le zoom.
     * MarkerView était une overlay RN qui disparaissait lors du re-rendu des tiles (régression).
     * Sélection : swap de variante (PinIcon ↔ PinIconSelected) + refresh() — PAS de transform
     * animée sur les enfants (le snapshot natif la gèlerait → no-op).
     *
     * onSelected (D-06) : ouvre directement la feuille de détail native (route /(app)/point/[id]).
     * onDeselected réinitialise l'état sélectionné — mitigation du quirk iOS de re-sélection
     * (re-taper une PointAnnotation déjà sélectionnée peut ne pas re-déclencher onSelected).
     * À valider sur appareil (Plan 05).
     */
    <MapboxGL.PointAnnotation
      ref={annRef}
      id={point.id}
      coordinate={[point.longitude, point.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      selected={selected}
      onSelected={() => {
        setSelected(true);
        if (navigatingRef.current) return;
        navigatingRef.current = true;
        router.push(`/(app)/point/${point.id}`);
        // Réarme après un court délai si onDeselected ne se déclenche pas (quirk iOS).
        setTimeout(() => { navigatingRef.current = false; }, 1200);
      }}
      onDeselected={() => { setSelected(false); navigatingRef.current = false; }}
    >
      {selected ? <PinIconSelected T={T} /> : <PinIcon T={T} />}
    </MapboxGL.PointAnnotation>
  );
}

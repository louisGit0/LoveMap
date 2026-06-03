import React, { useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { router } from 'expo-router';
import { F } from '@/constants/fonts';
import { noteHue } from '@/constants/markers';
import type { MapPoint } from '@/types/app.types';

type SealState = 'sealed' | 'pending' | 'active';

interface Props {
  point: MapPoint;
  /** Nombre de moments à ce même lieu (≥ 2 → pastille de compte sur le sceau). */
  count?: number;
}

// Pastille de compte (N moments au même lieu) — coin haut-droit du sceau.
// Encre + liseré/texte rose : se lit sans concurrencer la note gravée du disque.
function CountBadge({ count }: { count: number }) {
  return (
    <View style={{
      position: 'absolute',
      top: 0,
      right: 2,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 3,
      backgroundColor: '#000000',
      borderWidth: 1,
      borderColor: '#ff2d87',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ fontFamily: F.monoMedium, fontSize: 9, color: '#ff2d87' }}>{count}</Text>
    </View>
  );
}

/**
 * Le sceau — disque encré, note gravée en serif italic (la note EST le marqueur),
 * tige fine plantée sur la coordonnée exacte. Trois états : scellé (plein),
 * en attente (contour pointillé), actif (réservé — non déclenché sur la carte, cf. note).
 *
 * Rendu en Views RN (pas de SVG) pour rester fiable dans le snapshot natif de
 * PointAnnotation. Ancre géographique = bas-centre du sceau (pointe de la tige).
 * Palette fixe rose/blanc/encre (pas de token thème — le sceau est identique clair/sombre).
 */
export function Seal({ note, state = 'sealed', count }: { note: number; state?: SealState; count?: number }) {
  const c = noteHue(note);
  const pending = state === 'pending';
  const fill = pending ? '#0a0a0a' : c;
  const txt = pending ? c : '#ffffff';

  return (
    <View style={{ width: 44, height: 54, alignItems: 'center' }}>
      {count && count > 1 ? <CountBadge count={count} /> : null}

      {/* Disque scellé — fond plein + liseré OPAQUE (rendu fiable dans le snapshot natif :
          pas de halo translucide en absolute ni d'ombre, qui se composaient en voile gris). */}
      <View style={{ width: 44, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: fill,
          borderWidth: 2,
          borderColor: pending ? c : '#ffffff',
          borderStyle: pending ? 'dashed' : 'solid',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: F.serifMedium,
              fontSize: 18,
              lineHeight: 20,
              color: txt,
              textAlign: 'center',
              marginTop: -1,
              includeFontPadding: false,
            }}
          >
            {note}
          </Text>
        </View>
      </View>

      {/* Tige */}
      <View style={{ width: 1.5, height: 14, backgroundColor: c }} />
      {/* Point d'ancrage — la pointe marque la coordonnée exacte */}
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c }} />
    </View>
  );
}

export function PointMarker({ point, count }: Props) {
  const annRef = useRef<MapboxGL.PointAnnotation>(null);
  // Garde-fou anti-double-ouverture : `onSelected` peut se déclencher plusieurs fois par tap.
  const navigatingRef = useRef(false);

  // Re-snapshot après montage : le 1er snapshot natif peut précéder la mise en page du
  // texte (note gravée + pastille) → un refresh différé les capture.
  useEffect(() => {
    const t = setTimeout(() => annRef.current?.refresh(), 60);
    return () => clearTimeout(t);
  }, [count, point.note]);

  /*
   * PointAnnotation (annotation native Mapbox) — toujours visible quel que soit le zoom.
   * `selected={false}` constant : on n'utilise PAS l'état sélectionné natif (qui « collait »
   * en halo et empêchait de re-taper le pin — quirk iOS PointAnnotation, cf. build #30).
   * Le sceau garde donc toujours le même visuel (état « scellé »), et chaque tap re-déclenche
   * onSelected → ouverture fiable du détail. L'état « actif » du brief reste dispo dans <Seal>
   * pour d'autres contextes mais n'est volontairement pas piloté par la sélection ici.
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
      <Seal note={point.note} count={count} />
    </MapboxGL.PointAnnotation>
  );
}

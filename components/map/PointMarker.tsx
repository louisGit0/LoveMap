import React from 'react';
import { View, Text, Pressable } from 'react-native';
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
      right: 0,
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
 * en attente (contour pointillé), actif (réservé — non piloté par la sélection ici).
 *
 * Rendu en Views RN + <Text> live (via MarkerView, pas de snapshot natif) → la police
 * custom Cormorant s'affiche correctement. Ancre géo = bas-centre (pointe de la tige).
 * Palette fixe rose/blanc/encre (identique clair/sombre — le sceau vit sur la carte).
 */
export function Seal({ note, state = 'sealed', count }: { note: number; state?: SealState; count?: number }) {
  const c = noteHue(note);
  const pending = state === 'pending';
  const fill = pending ? '#0a0a0a' : c;
  const txt = pending ? c : '#ffffff';

  return (
    <View style={{ width: 44, height: 54, alignItems: 'center' }}>
      {count && count > 1 ? <CountBadge count={count} /> : null}

      {/* Disque scellé — fond plein + liseré opaque, ombre douce (MarkerView rend l'ombre). */}
      <View style={{ width: 44, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: fill,
          borderWidth: 1.5,
          borderColor: pending ? c : '#ffffff',
          borderStyle: pending ? 'dashed' : 'solid',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#000000',
          shadowOpacity: 0.5,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 4 },
          elevation: 5,
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
  /*
   * MarkerView (vues RN live) au lieu de PointAnnotation : le snapshot natif de
   * PointAnnotation ne rend pas le <Text> à police custom (Cormorant) → le sceau
   * apparaissait en « cercle gris transparent » (même cause que la pastille de compte
   * vide au build #30). MarkerView rend de vraies vues → note + pastille visibles, et
   * le tap passe par un <Pressable> standard (fini la triple-ouverture / le halo collé
   * des quirks onSelected de PointAnnotation). `allowOverlap` garde tous les pins
   * affichés quel que soit le zoom (sinon Mapbox masque les marqueurs qui se chevauchent).
   */
  return (
    <MapboxGL.MarkerView
      id={point.id}
      coordinate={[point.longitude, point.latitude]}
      anchor={{ x: 0.5, y: 1 }}
      allowOverlap
    >
      <Pressable
        onPress={() => router.push(`/(app)/point/${point.id}`)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Moment, note ${point.note} sur 10`}
      >
        <Seal note={point.note} count={count} />
      </Pressable>
    </MapboxGL.MarkerView>
  );
}

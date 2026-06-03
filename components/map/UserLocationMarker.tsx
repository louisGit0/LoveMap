import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { useReducedMotion } from 'react-native-reanimated';

interface Props {
  /** [longitude, latitude] — ordre GeoJSON. */
  coordinate: [number, number];
}

/**
 * Le relevé — votre position. Point blanc minimal (JAMAIS rose : « vous » ne doit pas se
 * confondre avec un moment), cœur blanc sur liseré noir, fin anneau, pulsation lente.
 *
 * Rendu via MarkerView (vues RN live → l'animation tourne réellement), à l'inverse du
 * snapshot figé d'une PointAnnotation. Remplace le point bleu système. Coupé si reduce-motion.
 */
export function UserLocationMarker({ coordinate }: Props) {
  const reduced = useReducedMotion();
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.timing(p, {
        toValue: 1,
        duration: 2800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [p, reduced]);

  const scale = p.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.4] });
  const opacity = p.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.5, 0, 0] });

  return (
    <MapboxGL.MarkerView coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
      <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
        {/* Pulsation — halo blanc qui s'ouvre puis s'efface */}
        {!reduced && (
          <Animated.View
            style={{
              position: 'absolute',
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: '#ffffff',
              opacity,
              transform: [{ scale }],
            }}
          />
        )}
        {/* Fin anneau de présence */}
        <View style={{
          position: 'absolute',
          width: 19,
          height: 19,
          borderRadius: 9.5,
          borderWidth: 1.2,
          borderColor: 'rgba(255,255,255,0.55)',
        }} />
        {/* Cœur : liseré noir (net sur n'importe quelle rue) + point blanc */}
        <View style={{
          width: 12.8,
          height: 12.8,
          borderRadius: 6.4,
          backgroundColor: 'rgba(0,0,0,0.5)',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ffffff' }} />
        </View>
      </View>
    </MapboxGL.MarkerView>
  );
}

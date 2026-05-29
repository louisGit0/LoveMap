import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { F } from '@/constants/fonts';

// Composant JETABLE (D-09) — preuve de vie des worklets Reanimated v4 sur device iOS.
// Monté uniquement sous __DEV__, retiré après vérification on-device (plan 01-04 Task 3).
// N'anime qu'une valeur numérique (opacity) ; aucune lecture de state JS dans le worklet.
export function ReanimatedSmokeTest() {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.badge, animatedStyle]} pointerEvents="none">
      <Text style={styles.label}>RNA v4</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#ff2d87',
    zIndex: 9999,
  },
  label: {
    fontFamily: F.mono,
    fontSize: 8,
    letterSpacing: 1,
    color: '#ffffff',
  },
});

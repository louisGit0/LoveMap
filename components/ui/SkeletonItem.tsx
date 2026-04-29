import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/constants/theme';

interface Props {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonItem({ width = '100%', height = 20, style }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[styles.base, { width: width as any, height }, style, { opacity }]}
    />
  );
}

export function SkeletonRow() {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={styles.row}>
      <SkeletonItem width={36} height={36} style={styles.avatar} />
      <View style={styles.rowContent}>
        <SkeletonItem width="60%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonItem width="40%" height={10} />
      </View>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  base: {
    backgroundColor: T.surface2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  avatar: {
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
  },
});

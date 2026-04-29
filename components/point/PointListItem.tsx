import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
  index: number;
}

export function PointListItem({ point, index }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const dateStr = new Date(point.happened_at ?? point.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/(app)/point/${point.id}`)}
      activeOpacity={0.75}
    >
      {/* Numéro */}
      <Text style={styles.number}>N°{String(index + 1).padStart(3, '0')}</Text>

      {/* Note grande */}
      <Text style={styles.note}>{point.note}</Text>

      {/* Commentaire */}
      <View style={styles.body}>
        {point.comment ? (
          <Text style={styles.comment} numberOfLines={1}>
            {point.comment}
          </Text>
        ) : (
          <Text style={styles.commentEmpty}>Sans commentaire</Text>
        )}
        <Text style={styles.meta}>
          {dateStr}
          {point.partnerUsername ? `  ·  @${point.partnerUsername}` : ''}
          {(point as any).address ? `  ·  ${(point as any).address}` : ''}
        </Text>
      </View>

      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 14,
  },
  number: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.textFaint,
    width: 38,
    textTransform: 'uppercase',
  },
  note: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 36,
    color: T.primary,
    minWidth: 28,
    textAlign: 'center',
  },
  body: {
    flex: 1,
  },
  comment: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: T.text,
    lineHeight: 22,
  },
  commentEmpty: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: T.textFaint,
    lineHeight: 22,
  },
  meta: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: T.textFaint,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  arrow: {
    fontFamily: F.sansLight,
    color: T.textFaint,
    fontSize: 20,
  },
});

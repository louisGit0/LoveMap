import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { haptics } from '@/lib/haptics';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';
import { PressableScale } from '@/components/ui/PressableScale';

interface Props {
  point: MapPoint;
  /** @deprecated N°00X supprimé (D-01) — conservé transitoirement, retiré en 04-01 Task 3 */
  index?: number;
}

export function PointListItem({ point }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const dateStr = new Date(point.happened_at ?? point.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <PressableScale
      style={styles.container}
      onPress={() => {
        haptics.tap();
        router.push(`/(app)/point/${point.id}`);
      }}
    >
      {/* Ancre — note /10 en Display 44 (T.text, pas rose) */}
      <View style={styles.anchor}>
        <Text style={styles.note}>{point.note}</Text>
        <Text style={styles.denom}>/10</Text>
      </View>

      {/* Corps — commentaire serif + méta mono */}
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
    </PressableScale>
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
    gap: 12,
  },
  anchor: {
    width: 64,
    alignItems: 'center',
  },
  note: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 44,
    lineHeight: 44,
    color: T.text,
    textAlign: 'center',
  },
  denom: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  comment: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.text,
    lineHeight: 26,
  },
  commentEmpty: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.textFaint,
    lineHeight: 26,
  },
  meta: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  arrow: {
    fontFamily: F.mono,
    color: T.textFaint,
    fontSize: 20,
  },
});

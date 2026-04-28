import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { PointListItem } from '@/components/point/PointListItem';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import type { MapPoint } from '@/types/app.types';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function groupByMonth(points: MapPoint[]): { title: string; monthNum: string; data: MapPoint[] }[] {
  const groups: Record<string, { label: string; monthNum: string; items: MapPoint[] }> = {};

  for (const p of points) {
    const d = new Date(p.happened_at ?? p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    if (!groups[key]) {
      groups[key] = {
        label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`,
        monthNum: String(d.getMonth() + 1).padStart(2, '0'),
        items: [],
      };
    }
    groups[key].items.push(p);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, { label, monthNum, items }]) => ({
      title: label,
      monthNum,
      data: items,
    }));
}

export default function PointList() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchMyPoints(user.id).then(() => setLoading(false));
  }, [user]);

  const sections = useMemo(() => groupByMonth(points), [points]);
  const monthCount = sections.length;

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index, section }) => {
          // Global index across all sections
          const sectionIdx = sections.indexOf(section);
          const prevTotal = sections
            .slice(0, sectionIdx)
            .reduce((acc, s) => acc + s.data.length, 0);
          return <PointListItem point={item} index={prevTotal + index} />;
        }}
        renderSectionHeader={({ section: { title, monthNum, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.sectionRight}>
              <Text style={styles.sectionCount}>{String(data.length).padStart(2, '0')}</Text>
            </View>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.innerBorder} pointerEvents="none" />
            <Text style={styles.eyebrow}>N° 002 — Journal</Text>
            <Text style={styles.title}>le carnet</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                {String(points.length).padStart(2, '0')} entrée{points.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.statSep}>·</Text>
              <Text style={styles.statText}>
                {String(monthCount).padStart(2, '0')} mois
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Le carnet est vierge.</Text>
            <Text style={styles.emptySubtitle}>Commencez à inscrire vos moments depuis la carte.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  centered: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 24,
    paddingHorizontal: 24,
    marginBottom: 8,
    position: 'relative',
  },
  innerBorder: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 0,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomWidth: 0,
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 8,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 56,
    lineHeight: 54,
    letterSpacing: -2,
    color: T.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  statSep: {
    color: T.border,
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 0,
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  sectionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionCount: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.textFaint,
  },
  empty: {
    paddingTop: 48,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 32,
    color: T.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
    textAlign: 'center',
    lineHeight: 22,
  },
});

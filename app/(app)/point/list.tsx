import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { SkeletonRow } from '@/components/ui/SkeletonItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useTheme } from '@/hooks/useTheme';
import { PointListItem } from '@/components/point/PointListItem';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type SortMode = 'date' | 'note';
type MinNote = 0 | 5 | 7 | 9;

const NOTE_FILTERS: { label: string; value: MinNote }[] = [
  { label: 'Tous', value: 0 },
  { label: '5+', value: 5 },
  { label: '7+', value: 7 },
  { label: '9+', value: 9 },
];

function groupByMonth(points: MapPoint[], sort: SortMode): { title: string; monthNum: string; data: MapPoint[] }[] {
  const sorted = [...points].sort((a, b) => {
    if (sort === 'note') return b.note - a.note;
    return new Date(b.happened_at ?? b.created_at).getTime() - new Date(a.happened_at ?? a.created_at).getTime();
  });

  const groups: Record<string, { label: string; monthNum: string; items: MapPoint[] }> = {};
  for (const p of sorted) {
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
    .map(([, { label, monthNum, items }]) => ({ title: label, monthNum, data: items }));
}

export default function PointList() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [minNote, setMinNote] = useState<MinNote>(0);
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const load = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    return fetchMyPoints(user.id);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().then((ok) => {
      setLoading(false);
      if (!ok) setSnackbar('Erreur de chargement. Tirez pour réessayer.');
    });
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const ok = await load();
    setRefreshing(false);
    if (!ok) setSnackbar('Erreur de chargement.');
  }, [load]);

  const filtered = useMemo(() => points.filter((p) => p.note >= minNote), [points, minNote]);
  const sections = useMemo(() => groupByMonth(filtered, sortMode), [filtered, sortMode]);
  const monthCount = sections.length;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingHorizontal: 24 }]}>
        {[1, 2, 3, 4].map((k) => <SkeletonRow key={k} />)}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index, section }) => {
          const sectionIdx = sections.indexOf(section);
          const prevTotal = sections.slice(0, sectionIdx).reduce((acc, s) => acc + s.data.length, 0);
          return <PointListItem point={item} index={prevTotal + index} />;
        }}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>{String(data.length).padStart(2, '0')}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>le carnet</Text>
            <Text style={styles.title}>Vos moments</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statNum}>{String(points.length).padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Entrées</Text>
              </View>
              <Text style={styles.statSep}>|</Text>
              <View style={styles.statBlock}>
                <Text style={styles.statNum}>{String(monthCount).padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Mois</Text>
              </View>
            </View>

            <View style={styles.filterBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                {NOTE_FILTERS.map(({ label, value }) => (
                  <TouchableOpacity
                    key={value}
                    style={[styles.pill, minNote === value && styles.pillActive]}
                    onPress={() => setMinNote(value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.pillText, minNote === value && styles.pillTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.pillSep} />
                <TouchableOpacity
                  style={[styles.pill, sortMode === 'date' && styles.pillActive]}
                  onPress={() => setSortMode('date')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pillText, sortMode === 'date' && styles.pillTextActive]}>Date</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pill, sortMode === 'note' && styles.pillActive]}
                  onPress={() => setSortMode('note')}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.pillText, sortMode === 'note' && styles.pillTextActive]}>Note</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {minNote > 0 ? `Aucun moment\nnoté ${minNote}+.` : `Aucun moment\nn'a encore été inscrit.`}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={T.primary}
            colors={[T.primary]}
          />
        }
      />
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  centered: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 32,
    paddingBottom: 0,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 6,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 48,
    lineHeight: 46,
    letterSpacing: -2,
    color: T.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statBlock: { alignItems: 'center' },
  statNum: {
    fontFamily: F.mono,
    fontSize: 20,
    letterSpacing: 0,
    color: T.text,
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginTop: 2,
  },
  statSep: { color: T.border, fontSize: 20, fontFamily: F.mono },
  filterBar: {
    marginHorizontal: -24,
    borderTopWidth: 1,
    borderTopColor: T.border,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  filterScroll: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: T.border,
  },
  pillActive: {
    borderColor: T.primary,
    backgroundColor: T.primary,
  },
  pillText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  pillTextActive: { color: T.text },
  pillSep: {
    width: 1,
    height: 14,
    backgroundColor: T.border,
    marginHorizontal: 4,
  },
  listContent: { paddingHorizontal: 24, paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  sectionTitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  sectionCount: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.textFaint,
  },
  snackbar: { backgroundColor: T.surface2 },
  empty: { paddingTop: 48, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 32,
    lineHeight: 34,
    color: T.text,
    textAlign: 'center',
    marginBottom: 20,
  },
});

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Snackbar } from 'react-native-paper';
import { SkeletonRow } from '@/components/ui/SkeletonItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptics } from '@/lib/haptics';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useTheme } from '@/hooks/useTheme';
import { PointListItem } from '@/components/point/PointListItem';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

/* ─── État de filtre inline (D-03) — remplace FiltersBottomSheet ──────── */

type MinNote = 0 | 5 | 7 | 9;
type Sort = 'date' | 'note';

/** Clé de tri consommée par groupByMonth (inlinée depuis l'ancien FiltersBottomSheet) */
type GroupSort = 'date_desc' | 'date_asc' | 'note_desc' | 'note_asc';

const NOTE_OPTIONS: { value: MinNote; label: string }[] = [
  { value: 0, label: 'Toutes' },
  { value: 5, label: '5+' },
  { value: 7, label: '7+' },
  { value: 9, label: '9+' },
];

const SORT_OPTIONS: { value: Sort; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'note', label: 'Note' },
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function groupByMonth(points: MapPoint[], sort: GroupSort): { title: string; monthNum: string; data: MapPoint[] }[] {
  const sorted = [...points].sort((a, b) => {
    const da = new Date(a.happened_at ?? a.created_at).getTime();
    const db = new Date(b.happened_at ?? b.created_at).getTime();
    if (sort === 'date_desc') return db - da;
    if (sort === 'date_asc') return da - db;
    if (sort === 'note_desc') return b.note - a.note;
    if (sort === 'note_asc') return a.note - b.note;
    return db - da;
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

/* ─── Pill de filtre inline (D-03) ───────────────────────────────────── */

function FilterPill({ label, active, onPress, styles }: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
      onPress={() => {
        haptics.select();
        onPress();
      }}
      activeOpacity={0.75}
    >
      <Text style={[styles.pillLabel, active ? styles.pillLabelActive : styles.pillLabelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function PointList() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [minNote, setMinNote] = useState<MinNote>(0);
  const [sort, setSort] = useState<Sort>('date');

  const load = useCallback(async (): Promise<boolean> => {
    if (!user) return false;
    return fetchMyPoints(user.id);
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().then((ok) => {
      setLoading(false);
      if (!ok) setSnackbar('Impossible de charger les moments. Réessayez.');
    });
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const ok = await load();
    setRefreshing(false);
    if (!ok) setSnackbar('Impossible de charger les moments. Réessayez.');
  }, [load]);

  const sections = useMemo(() => {
    const filtered = points.filter((p) => p.note >= minNote);
    return groupByMonth(filtered, sort === 'note' ? 'note_desc' : 'date_desc');
  }, [points, minNote, sort]);

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
        renderItem={({ item }) => <PointListItem point={item} />}
        renderSectionHeader={({ section: { title, data } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
            <Text style={styles.sectionCount}>{String(data.length).padStart(2, '0')}</Text>
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Le carnet</Text>

            {/* Filtres inline en pills (D-03) */}
            <View style={styles.pillRow}>
              {NOTE_OPTIONS.map((o) => (
                <FilterPill
                  key={o.value}
                  label={o.label}
                  active={minNote === o.value}
                  onPress={() => setMinNote(o.value)}
                  styles={styles}
                />
              ))}
            </View>
            <View style={styles.pillRow}>
              {SORT_OPTIONS.map((o) => (
                <FilterPill
                  key={o.value}
                  label={o.label}
                  active={sort === o.value}
                  onPress={() => setSort(o.value)}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Le carnet est vide.</Text>
            <Text style={styles.emptyBody}>Posez votre premier moment sur la carte.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
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
  header: {
    paddingTop: 32,
    paddingBottom: 0,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    color: T.text,
    marginBottom: 16,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    borderRadius: T.pill,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: T.border,
  },
  pillLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pillLabelActive: {
    color: T.text,
  },
  pillLabelInactive: {
    color: T.textDim,
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
    backgroundColor: T.bg,
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
  empty: { paddingTop: 64, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 34,
    color: T.textDim,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyBody: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    textAlign: 'center',
  },
});

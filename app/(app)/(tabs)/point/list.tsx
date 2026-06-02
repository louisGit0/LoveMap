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
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useTheme } from '@/hooks/useTheme';
import { PointListItem } from '@/components/point/PointListItem';
import {
  FiltersBottomSheet,
  DEFAULT_FILTERS,
  countActiveFilters,
  type FiltersState,
  type FilterSort,
} from '@/components/point/FiltersBottomSheet';
import { IcoFilter } from '@/components/icons';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function groupByMonth(points: MapPoint[], sort: FilterSort): { title: string; monthNum: string; data: MapPoint[] }[] {
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

export default function PointList() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FiltersState>(DEFAULT_FILTERS);

  const activeCount = countActiveFilters(filters);

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

  const filtered = useMemo(() => {
    return points.filter((p) => {
      // Filtre par note minimale
      if (p.note < filters.minNote) return false;

      // Filtre par statut de consentement partenaire
      if (filters.partnerStatus !== 'all') {
        if ((p.partnerStatus ?? null) !== filters.partnerStatus) return false;
      }

      // Filtre par période
      if (filters.period !== null) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - filters.period);
        const date = new Date(p.happened_at ?? p.created_at);
        if (date < cutoff) return false;
      }

      return true;
    });
  }, [points, filters]);

  const sections = useMemo(() => groupByMonth(filtered, filters.sort), [filtered, filters.sort]);

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

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statNum}>{String(points.length).padStart(2, '0')}</Text>
                <Text style={styles.statLabel}>Entrées</Text>
              </View>
              {points.length > 0 && (
                <View style={styles.statDivider} />
              )}
              {points.length > 0 && (
                <View style={styles.statBlock}>
                  <Text style={styles.statNum}>
                    {points.length > 0
                      ? (points.reduce((s, p) => s + p.note, 0) / points.length).toFixed(1)
                      : '—'}
                  </Text>
                  <Text style={styles.statLabel}>Moy.</Text>
                </View>
              )}
            </View>

            {/* Bouton Filtres */}
            <TouchableOpacity
              style={[styles.filterBar, activeCount > 0 && styles.filterBarActive]}
              onPress={() => setFiltersOpen(true)}
              activeOpacity={0.7}
            >
              <IcoFilter size={13} color={activeCount > 0 ? T.primary : T.textFaint} />
              <Text style={[styles.filtersBtnText, activeCount > 0 && styles.filtersBtnTextActive]}>
                {activeCount > 0 ? `Filtres actifs` : 'Filtres'}
              </Text>
              {activeCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeCount}</Text>
                </View>
              ) : (
                <Text style={styles.filterArrow}>›</Text>
              )}
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {activeCount > 0
                ? 'Aucun résultat\npour ces filtres.'
                : 'Aucun moment\nn\'a encore été inscrit.'}
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

      <FiltersBottomSheet
        visible={filtersOpen}
        filters={filters}
        onApply={(f) => setFilters(f)}
        onClose={() => setFiltersOpen(false)}
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
    gap: 20,
    marginBottom: 20,
  },
  statBlock: { alignItems: 'flex-start' },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: T.border,
  },
  statNum: {
    fontFamily: F.mono,
    fontSize: 22,
    letterSpacing: -0.5,
    color: T.text,
    lineHeight: 24,
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginTop: 2,
  },
  filterBar: {
    marginHorizontal: -24,
    borderTopWidth: 1,
    borderTopColor: T.border,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterBarActive: {
    borderTopColor: T.primary + '40',
    borderBottomColor: T.primary + '40',
  },
  filtersBtnText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    flex: 1,
  },
  filtersBtnTextActive: {
    color: T.primary,
  },
  filterArrow: {
    fontFamily: F.sansLight,
    fontSize: 18,
    color: T.textFaint,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: T.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 18,
    height: 16,
  },
  badgeText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: '#ffffff',
    lineHeight: 14,
    letterSpacing: 0.5,
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
  empty: { paddingTop: 64, alignItems: 'center', paddingHorizontal: 40 },
  emptyTitle: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 30,
    lineHeight: 34,
    color: T.textDim,
    textAlign: 'center',
    marginBottom: 20,
  },
});

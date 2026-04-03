import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { PointListItem } from '@/components/point/PointListItem';
import type { MapPoint } from '@/types/app.types';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function groupByMonth(points: MapPoint[]): { title: string; data: MapPoint[] }[] {
  const groups: Record<string, MapPoint[]> = {};

  for (const p of points) {
    const d = new Date(p.happened_at ?? p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    const label = `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  }

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, data]) => {
      const d = new Date(data[0].happened_at ?? data[0].created_at);
      return { title: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, data };
    });
}

export default function PointList() {
  const { user } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchMyPoints(user.id).then(() => setLoading(false));
  }, [user]);

  const sections = useMemo(() => groupByMonth(points), [points]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e91e8c" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes points</Text>
        <Text style={styles.count}>{points.length} point{points.length > 1 ? 's' : ''}</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PointListItem point={item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun point pour le moment</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#888888',
    fontSize: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  count: {
    color: '#888888',
    fontSize: 13,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  sectionTitle: {
    color: '#e91e8c',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 16,
    marginBottom: 8,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#888888',
    fontSize: 15,
  },
});

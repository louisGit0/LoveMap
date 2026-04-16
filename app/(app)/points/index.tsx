import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { FAB } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { PointCard } from '@/components/point/PointCard';
import type { MapPoint } from '@/types/app.types';
import type { ConsentStatus } from '@/types/database.types';

type SortKey = 'date' | 'note';

interface PointWithConsent {
  point: MapPoint;
  consentStatus: ConsentStatus | null;
}

export default function PointsScreen() {
  const { user } = useAuth();
  const { fetchMyPoints } = usePoints();

  const [items, setItems] = useState<PointWithConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('date');

  const loadPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    await fetchMyPoints(user.id);

    // Récupérer les points avec leur statut de consentement
    const { data: rawPoints } = await supabase
      .from('points')
      .select('*, point_partners(status)')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (rawPoints) {
      const mapped: PointWithConsent[] = rawPoints.map((raw) => {
        const coords = (raw.location as { coordinates: [number, number] })?.coordinates ?? [0, 0];
        const point: MapPoint = { ...raw, longitude: coords[0], latitude: coords[1] };
        const partners = raw.point_partners as { status: ConsentStatus }[] | null;
        const consentStatus: ConsentStatus | null =
          partners && partners.length > 0 ? partners[0].status : null;
        return { point, consentStatus };
      });
      setItems(mapped);
    }

    setLoading(false);
  }, [user, fetchMyPoints]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const filtered = items
    .filter(({ point }) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        (point.comment?.toLowerCase().includes(q) ?? false)
      );
    })
    .sort((a, b) => {
      if (sort === 'note') return b.point.note - a.point.note;
      return new Date(b.point.created_at).getTime() - new Date(a.point.created_at).getTime();
    });

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.title}>Mes points</Text>

      {/* Recherche + tri */}
      <View style={styles.controls}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher..."
          placeholderTextColor="#555"
        />
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortBtn, sort === 'date' && styles.sortBtnActive]}
            onPress={() => setSort('date')}
          >
            <Text style={[styles.sortBtnText, sort === 'date' && styles.sortBtnTextActive]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sort === 'note' && styles.sortBtnActive]}
            onPress={() => setSort('note')}
          >
            <Text style={[styles.sortBtnText, sort === 'note' && styles.sortBtnTextActive]}>
              Note
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#e91e8c" style={styles.loader} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {items.length === 0
              ? "Tu n'as pas encore créé de point. Appuie sur + depuis la carte pour commencer."
              : "Aucun résultat pour cette recherche."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.point.id}
          renderItem={({ item }) => (
            <PointCard
              point={item.point}
              consentStatus={item.consentStatus}
              onPress={() => router.push(`/(app)/point/${item.point.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={styles.fab}
        color="#ffffff"
        onPress={() => router.push('/(app)/map')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingTop: 56,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  controls: {
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortBtn: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  sortBtnActive: {
    borderColor: '#e91e8c',
    backgroundColor: '#e91e8c22',
  },
  sortBtnText: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '500',
  },
  sortBtnTextActive: {
    color: '#e91e8c',
  },
  loader: {
    marginTop: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    backgroundColor: '#e91e8c',
  },
});

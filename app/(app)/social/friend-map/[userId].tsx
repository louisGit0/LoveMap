import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import type { MapPoint, Profile } from '@/types/app.types';
import { PointMarker } from '@/components/map/PointMarker';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
];

export default function FriendMapScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  const [friendProfile, setFriendProfile] = useState<Profile | null>(null);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    loadData();
  }, [userId]);

  async function loadData() {
    setLoading(true);

    const [profileResult, pointsResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', userId)
        .single(),
      supabase
        .from('points')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false }),
    ]);

    if (profileResult.data) {
      setFriendProfile(profileResult.data as Profile);
    }

    if (pointsResult.data) {
      const mapped: MapPoint[] = pointsResult.data.map((raw) => {
        const coords = (raw.location as { coordinates: [number, number] })?.coordinates ?? [0, 0];
        return { ...raw, longitude: coords[0], latitude: coords[1] };
      });
      setPoints(mapped);
    }

    setLoading(false);
  }

  // Calculer la région initiale centrée sur les points
  const initialRegion = points.length > 0
    ? {
        latitude:
          points.reduce((sum, p) => sum + p.latitude, 0) / points.length,
        longitude:
          points.reduce((sum, p) => sum + p.longitude, 0) / points.length,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : { latitude: 48.8566, longitude: 2.3522, latitudeDelta: 0.1, longitudeDelta: 0.1 };

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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {friendProfile?.display_name ?? friendProfile?.username ?? 'Carte ami'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Carte */}
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={darkMapStyle}
      >
        {points.map((point) => (
          <PointMarker key={point.id} point={point} isOwner={false} />
        ))}
      </MapView>

      {/* Badge compteur */}
      {points.length > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{points.length} point{points.length > 1 ? 's' : ''}</Text>
        </View>
      )}

      {points.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>
            {friendProfile?.display_name ?? 'Cet ami'} n'a pas encore de points visibles.
          </Text>
        </View>
      )}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0f0f0fcc',
    gap: 12,
  },
  backButton: {
    backgroundColor: '#1a1a1acc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 70,
  },
  countBadge: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
    backgroundColor: '#1a1a1acc',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  countBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#1a1a1acc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

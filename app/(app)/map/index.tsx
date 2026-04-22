import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { FAB, Snackbar } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { useMapStore } from '@/stores/mapStore';
import { AppMapView } from '@/components/map/AppMapView';
import { MapHeader } from '@/components/map/MapHeader';
import { FriendSelector } from '@/components/map/FriendSelector';
import { PointMarker } from '@/components/map/PointMarker';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { supabase } from '@/lib/supabase';
import { T } from '@/constants/theme';

export default function MapScreen() {
  const { user } = useAuth();
  const { points, fetchMyPoints, fetchFriendPoints, deletePoint } = usePoints();
  const { fetchFriends } = useFriends();
  const { viewMode, setViewMode, viewingFriendId, viewingFriendName, setViewingFriend } = useMapStore();

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [centerCoords, setCenterCoords] = useState({ latitude: 48.8566, longitude: 2.3522 });

  useEffect(() => {
    if (user) fetchFriends(user.id);
  }, [user]);

  const loadPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (viewingFriendId) {
      await fetchFriendPoints(viewingFriendId);
    } else {
      await fetchMyPoints(user.id);
    }
    setLoading(false);
  }, [user, viewingFriendId, fetchMyPoints, fetchFriendPoints]);

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  function handleLongPress(coords: { latitude: number; longitude: number }) {
    router.push({
      pathname: '/(app)/point/new',
      params: { latitude: coords.latitude.toString(), longitude: coords.longitude.toString() },
    });
  }

  function handleFabPress() {
    router.push({
      pathname: '/(app)/point/new',
      params: {
        latitude: centerCoords.latitude.toString(),
        longitude: centerCoords.longitude.toString(),
      },
    });
  }

  async function handleDelete(pointId: string) {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce point ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const ok = await deletePoint(pointId);
          if (ok) setSnackbar('Point supprimé.');
          else setSnackbar('Erreur lors de la suppression.');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <AppMapView
        onLongPress={viewingFriendId ? undefined : handleLongPress}
        onCenterChange={setCenterCoords}
      >
        {viewMode === 'pins' &&
          points.map((p) => (
            <PointMarker
              key={p.id}
              point={p}
              isOwner={p.creator_id === user?.id}
              onDelete={handleDelete}
            />
          ))}
        {viewMode === 'heatmap' && <HeatmapLayer points={points} />}
      </AppMapView>

      <MapHeader
        viewMode={viewMode}
        onViewModeChange={(v) => setViewMode(v)}
        friendName={viewingFriendName}
        onFriendClear={() => setViewingFriend(null)}
        leftSlot={
          <FriendSelector
            isViewingFriend={!!viewingFriendId}
            onSelectFriend={(id, name) => setViewingFriend(id, name)}
            onSelectSelf={() => setViewingFriend(null)}
          />
        }
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      )}

      {!viewingFriendId && (
        <FAB
          icon="plus"
          style={styles.fab}
          color="#ffffff"
          onPress={handleFabPress}
        />
      )}

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fab: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    backgroundColor: T.primary,
    borderRadius: T.pill,
  },
  snackbar: {
    backgroundColor: T.surface2,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { FAB, SegmentedButtons, Snackbar } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useMapStore } from '@/stores/mapStore';
import { AppMapView } from '@/components/map/AppMapView';
import { PointMarker } from '@/components/map/PointMarker';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { supabase } from '@/lib/supabase';

export default function MapScreen() {
  const { user } = useAuth();
  const { points, fetchMyPoints, deletePoint } = usePoints();
  const { viewMode, setViewMode } = useMapStore();

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [centerCoords, setCenterCoords] = useState({ latitude: 48.8566, longitude: 2.3522 });

  const loadPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchMyPoints(user.id);
    setLoading(false);
  }, [user, fetchMyPoints]);

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
        onLongPress={handleLongPress}
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

      {/* Toggle Pins / Heatmap */}
      <View style={styles.toggleContainer}>
        <SegmentedButtons
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'pins' | 'heatmap')}
          buttons={[
            { value: 'pins', label: 'Pins', icon: 'map-marker' },
            { value: 'heatmap', label: 'Heatmap', icon: 'fire' },
          ]}
          style={styles.segmented}
          theme={{
            colors: {
              secondaryContainer: '#e91e8c22',
              onSecondaryContainer: '#e91e8c',
              outline: '#2a2a2a',
            },
          }}
        />
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#e91e8c" size="large" />
        </View>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        color="#ffffff"
        onPress={handleFabPress}
      />

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
    backgroundColor: '#0f0f0f',
  },
  toggleContainer: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
  },
  segmented: {
    backgroundColor: '#1a1a1aee',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: '#e91e8c',
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

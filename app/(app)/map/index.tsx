import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { useMapStore } from '@/stores/mapStore';
import { AppMapView } from '@/components/map/AppMapView';
import { MapHeader } from '@/components/map/MapHeader';
import { FriendSelector } from '@/components/map/FriendSelector';
import { PointMarker } from '@/components/map/PointMarker';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoPlus } from '@/components/icons';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints, fetchFriendPoints, deletePoint } = usePoints();
  const { fetchFriends } = useFriends();
  const { viewMode, setViewMode, viewingFriendId, viewingFriendName, setViewingFriend } = useMapStore();

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [centerCoords, setCenterCoords] = useState({ latitude: 48.8566, longitude: 2.3522 });

  useEffect(() => { if (user) fetchFriends(user.id); }, [user]);

  const loadPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (viewingFriendId) await fetchFriendPoints(viewingFriendId);
    else await fetchMyPoints(user.id);
    setLoading(false);
  }, [user, viewingFriendId]);

  useEffect(() => { loadPoints(); }, [loadPoints]);

  function handleLongPress(coords: { latitude: number; longitude: number }) {
    router.push({ pathname: '/(app)/point/new', params: { latitude: coords.latitude.toString(), longitude: coords.longitude.toString() } });
  }

  function handleFabPress() {
    router.push({ pathname: '/(app)/point/new', params: { latitude: centerCoords.latitude.toString(), longitude: centerCoords.longitude.toString() } });
  }

  async function handleDelete(pointId: string) {
    Alert.alert('Effacer cette page', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Effacer', style: 'destructive', onPress: async () => {
        const ok = await deletePoint(pointId);
        setSnackbar(ok ? 'Page effacée.' : 'Erreur lors de la suppression.');
      }},
    ]);
  }

  const isEmpty = !loading && points.length === 0 && !viewingFriendId;

  return (
    <View style={styles.container}>
      <AppMapView onLongPress={viewingFriendId ? undefined : handleLongPress} onCenterChange={setCenterCoords}>
        {viewMode === 'pins' && points.map((p) => (
          <PointMarker key={p.id} point={p} isOwner={p.creator_id === user?.id} onDelete={handleDelete} />
        ))}
        {viewMode === 'heatmap' && <HeatmapLayer points={points} />}
      </AppMapView>

      <MapHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
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

      {/* Empty state */}
      {isEmpty && (
        <View style={styles.emptyState} pointerEvents="none">
          <Text style={styles.emptyTitle}>La page n'attend{'\n'}que vous.</Text>
          <TouchableOpacity onPress={handleFabPress} pointerEvents="auto">
            <Text style={styles.emptyLink}>Inscrire mon premier moment →</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={T.primary} size="large" />
        </View>
      )}

      {/* FAB carré */}
      {!viewingFriendId && (
        <TouchableOpacity
          onPress={handleFabPress}
          style={[styles.fab, { bottom: insets.bottom + 80 }]}
          activeOpacity={0.88}
        >
          <IcoPlus size={22} color={T.text} />
        </TouchableOpacity>
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={2500} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emptyState: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1,
    color: T.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyLink: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.textDim,
    textDecorationLine: 'underline',
  },
  fab: {
    position: 'absolute',
    right: 20,
    width: 52,
    height: 52,
    backgroundColor: T.primary,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  snackbar: { backgroundColor: T.surface2 },
});

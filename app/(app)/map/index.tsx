import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { useMapStore } from '@/stores/mapStore';
import { useTheme } from '@/hooks/useTheme';
import { AppMapView } from '@/components/map/AppMapView';
import { MapHeader } from '@/components/map/MapHeader';
import { FriendSelector } from '@/components/map/FriendSelector';
import { PointMarker } from '@/components/map/PointMarker';
import { HeatmapLayer } from '@/components/map/HeatmapLayer';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoPlus } from '@/components/icons';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints, fetchFriendPoints, deletePoint } = usePoints();
  const { fetchFriends } = useFriends();
  const { viewMode, setViewMode, viewingFriendId, viewingFriendName, setViewingFriend } = useMapStore();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [centerCoords, setCenterCoords] = useState({ latitude: 48.8566, longitude: 2.3522 });

  useEffect(() => { if (user) fetchFriends(user.id); }, [user]);

  const loadPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ok = viewingFriendId
      ? await fetchFriendPoints(viewingFriendId)
      : await fetchMyPoints(user.id);
    setLoading(false);
    if (!ok) setSnackbar('Erreur de chargement. Vérifiez votre connexion.');
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
        pointCount={points.length}
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

      {/* Hint discret quand aucun point — non bloquant */}
      {!loading && points.length === 0 && !viewingFriendId && (
        <View style={[styles.emptyHint, { bottom: insets.bottom + 148 }]} pointerEvents="none">
          <Text style={styles.emptyHintText}>Appuyez sur + pour inscrire votre premier moment</Text>
        </View>
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={2500} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emptyHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  emptyHintText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    paddingHorizontal: 40,
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

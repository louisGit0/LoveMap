import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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
import { haptics } from '@/lib/haptics';
import type { MapPoint } from '@/types/app.types';

// Cascade d'apparition (D-07) : montage STAGGERED des markers.
// La cascade vient du MONTAGE échelonné (le pin « pop in » en étant monté),
// PAS d'une opacité animée à l'intérieur du snapshot natif (qui serait gelée).
const STAGGER_MS = 40;
const CAP_MS = 320;
const MAX_STAGGERED = 30;

function useStaggeredVisible(count: number): number {
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (count === 0) { setVisible(0); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    const staggered = Math.min(count, MAX_STAGGERED);
    for (let i = 0; i < staggered; i++) {
      timers.push(
        setTimeout(
          () => setVisible((v) => Math.max(v, i + 1)),
          Math.min(i * STAGGER_MS, CAP_MS),
        ),
      );
    }
    // Le reste (au-delà du plafond) est monté d'un coup à CAP_MS — pas de longue traîne.
    if (count > staggered) {
      timers.push(setTimeout(() => setVisible(count), CAP_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [count]);
  return visible;
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { points, fetchMyPoints, fetchFriendPoints } = usePoints();
  const { fetchFriends } = useFriends();
  const { viewMode, setViewMode, viewingFriendId, viewingFriendName, setViewingFriend } = useMapStore();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [centerCoords, setCenterCoords] = useState({ latitude: 48.8566, longitude: 2.3522 });

  // La carte n'affiche que les moments VALIDÉS (is_visible=TRUE) : un point apparaît sur la carte
  // uniquement quand un partenaire mentionné a accepté. Tant qu'aucune mention n'est acceptée,
  // le moment reste « en attente » et n'est visible que dans le carnet (onglet Moments).
  const visiblePoints = useMemo(() => points.filter((p) => p.is_visible), [points]);

  // Regroupement des moments par lieu : un seul pin par coordonnée, avec le nombre
  // de moments à cet endroit (plusieurs moments au même lieu → pin unique + pastille).
  // Le représentant affiché est le moment le plus récent du lieu.
  const groupedMarkers = useMemo(() => {
    const byCoord = new Map<string, { point: MapPoint; count: number }>();
    for (const p of visiblePoints) {
      const key = `${p.longitude.toFixed(5)},${p.latitude.toFixed(5)}`;
      const g = byCoord.get(key);
      if (g) {
        g.count += 1;
        const pt = new Date(p.happened_at ?? p.created_at).getTime();
        const et = new Date(g.point.happened_at ?? g.point.created_at).getTime();
        if (pt > et) g.point = p;
      } else {
        byCoord.set(key, { point: p, count: 1 });
      }
    }
    return [...byCoord.values()];
  }, [visiblePoints]);

  // Cascade au montage — révèle progressivement les premiers markers.
  const visibleCount = useStaggeredVisible(groupedMarkers.length);

  // Micro-anim FAB (D-11) — reanimated sur transform: scale uniquement (compositor-friendly).
  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: fabScale.value }] }));

  useEffect(() => { if (user) fetchFriends(user.id); }, [user]);

  const loadPoints = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ok = viewingFriendId
      ? await fetchFriendPoints(viewingFriendId)
      : await fetchMyPoints(user.id);
    setLoading(false);
    if (!ok) { haptics.error(); setSnackbar('Erreur de chargement. Vérifiez votre connexion.'); }
  }, [user, viewingFriendId]);

  useEffect(() => { loadPoints(); }, [loadPoints]);

  // En mode « vue ami » : barycentre des points de l'ami pour recentrer la caméra
  // (sinon les points de l'ami resteraient hors écran, centrés sur ma position).
  const friendFocus = useMemo(() => {
    if (!viewingFriendId || points.length === 0) return null;
    const lat = points.reduce((s, p) => s + p.latitude, 0) / points.length;
    const lng = points.reduce((s, p) => s + p.longitude, 0) / points.length;
    return { latitude: lat, longitude: lng };
  }, [viewingFriendId, points]);

  function handleLongPress(coords: { latitude: number; longitude: number }) {
    router.push({ pathname: '/(app)/point/new', params: { latitude: coords.latitude.toString(), longitude: coords.longitude.toString() } });
  }

  function handleFabPress() {
    haptics.press();
    router.push({ pathname: '/(app)/point/new', params: { latitude: centerCoords.latitude.toString(), longitude: centerCoords.longitude.toString() } });
  }

  return (
    <View style={styles.container}>
      <AppMapView
        onLongPress={viewingFriendId ? undefined : handleLongPress}
        onCenterChange={setCenterCoords}
        showUserLocation={!viewingFriendId}
        focusCoords={friendFocus}
      >
        {viewMode === 'pins' && groupedMarkers.slice(0, visibleCount).map((m) => (
          <PointMarker key={m.point.id} point={m.point} count={m.count} />
        ))}
        {viewMode === 'heatmap' && <HeatmapLayer points={visiblePoints} />}
      </AppMapView>

      <MapHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        friendName={viewingFriendName}
        onFriendClear={() => setViewingFriend(null)}
        pointCount={visiblePoints.length}
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

      {/* FAB squircle (D-11/D-12) — non Material, micro-anim spring + haptic */}
      {!viewingFriendId && (
        <Animated.View style={[styles.fabWrap, { bottom: insets.bottom + 80 }, fabAnimStyle]}>
          <Pressable
            onPress={handleFabPress}
            onPressIn={() => { fabScale.value = withSpring(0.92); }}
            onPressOut={() => { fabScale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
            accessibilityLabel="Inscrire un moment"
            style={styles.fab}
          >
            <IcoPlus size={24} color={T.text} />
          </Pressable>
        </Animated.View>
      )}

      {/* Hint discret quand aucun point validé sur la carte — non bloquant */}
      {!loading && visiblePoints.length === 0 && !viewingFriendId && (
        <View style={[styles.emptyHint, { bottom: insets.bottom + 148 }]} pointerEvents="none">
          <Text style={styles.emptyHintText}>
            {points.length === 0
              ? 'Appuyez sur + pour inscrire votre premier moment'
              : 'Vos moments apparaissent ici une fois la mention acceptée'}
          </Text>
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
  fabWrap: {
    position: 'absolute',
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    backgroundColor: T.primary,
    borderRadius: T.fab,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  snackbar: { backgroundColor: T.surface2 },
});

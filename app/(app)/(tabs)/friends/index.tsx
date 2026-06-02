import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useFriendStore } from '@/stores/friendStore';
import { useMapStore } from '@/stores/mapStore';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/lib/haptics';
import { FriendItem } from '@/components/friends/FriendItem';
import { Input } from '@/components/ui/Input';
import { SkeletonRow } from '@/components/ui/SkeletonItem';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoPlus } from '@/components/icons';
import type { Profile } from '@/types/app.types';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { friends, fetchFriends, fetchPendingReceived, fetchPendingTagsCount, searchUsers, sendFriendRequest, unfriend, setPendingReceived } = useFriends();
  const pendingReceived = useFriendStore((s) => s.pendingReceived);
  const { setViewingFriend } = useMapStore();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [pendingTagsCount, setPendingTagsCount] = useState(0);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ok = await fetchFriends(user.id);
    if (!ok) { setLoading(false); setSnackbar('Erreur de chargement.'); return; }
    setPendingReceived(await fetchPendingReceived(user.id));
    setPendingTagsCount(await fetchPendingTagsCount(user.id));
    setLoading(false);
  }, [user, fetchFriends, fetchPendingReceived, fetchPendingTagsCount, setPendingReceived]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFriends();
    setRefreshing(false);
  }, [loadFriends]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchResults(await searchUsers(searchQuery.trim()));
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchUsers]);

  async function handleAdd(profile: Profile) {
    if (!user) return;
    const ok = await sendFriendRequest(user.id, profile.id);
    if (ok) {
      setSnackbar(`Demande envoyée à ${profile.display_name ?? profile.username}.`);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setSnackbar("Erreur lors de l'envoi de la demande.");
    }
  }

  async function handleUnfriend(friendshipId: string) {
    const ok = await unfriend(friendshipId);
    if (ok) {
      setSnackbar('Retiré du cercle.');
    } else {
      haptics.error();
      setSnackbar('Échec — réessayez.');
    }
  }

  const alreadyFriendIds = new Set(friends.map((f) => f.profile.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Confidents</Text>
        <Text style={styles.title} maxFontSizeMultiplier={1.25}>Le cercle</Text>
        <Text style={styles.subtitle}>
          {friends.length} lien{friends.length > 1 ? 's' : ''} · {pendingReceived.length} demande{pendingReceived.length > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Section inviter */}
        <Text style={styles.sectionLabel}>Inviter quelqu'un</Text>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher dans le cercle"
          autoCapitalize="none"
          containerStyle={styles.searchInputContainer}
          right={searchLoading ? <ActivityIndicator color={T.primary} size="small" /> : null}
        />

        {/* Section demandes */}
        <TouchableOpacity
          style={styles.requestsRow}
          onPress={() => router.push('/(app)/friends/requests')}
          activeOpacity={0.75}
        >
          <View style={styles.requestsLeft}>
            <Text style={styles.requestsLabel}>Demandes & mentions</Text>
            {pendingReceived.length + pendingTagsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingReceived.length + pendingTagsCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.requestsValue}>
            {pendingReceived.length + pendingTagsCount === 0 ? 'aucune pour l\'instant' : `${pendingReceived.length + pendingTagsCount} en attente`}
          </Text>
          <Text style={styles.requestsArrow}>›</Text>
        </TouchableOpacity>

        {/* Recherche sans résultat */}
        {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
          <Text style={styles.searchNoResult}>Aucun nom ne correspond.</Text>
        )}

        {/* Résultats recherche */}
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((u) => (
              <View key={u.id} style={styles.searchResultItem}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>
                    {(u.display_name ?? u.username)[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.resultName}>{u.display_name}</Text>
                  <Text style={styles.resultUsername}>@{u.username}</Text>
                </View>
                {alreadyFriendIds.has(u.id) ? (
                  <Text style={styles.alreadyFriend}>Dans le cercle</Text>
                ) : (
                  <TouchableOpacity style={styles.addBtn} onPress={() => handleAdd(u)} activeOpacity={0.8}>
                    <IcoPlus size={14} color={T.text} />
                    <Text style={styles.addBtnText}>Inviter</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Liste amis */}
        {loading ? (
          <View style={styles.skeletonList}>
            {[1, 2, 3].map((k) => <SkeletonRow key={k} />)}
          </View>
        ) : friends.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Votre cercle est vide.</Text>
            <Text style={styles.emptySubtitle}>Cherchez un nom pour inviter quelqu'un.</Text>
          </View>
        ) : (
          <>
            <View style={styles.cercleSectionRow}>
              <Text style={styles.cercleSectionLabel}>Mon cercle</Text>
              <Text style={styles.cercleSectionCount}>{String(friends.length).padStart(2, '0')}</Text>
            </View>
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FriendItem
                  friend={item}
                  onUnfriend={() => handleUnfriend(item.id)}
                  onViewMap={() => {
                    setViewingFriend(item.profile.id, item.profile.display_name ?? item.profile.username);
                    router.push('/(app)/map');
                  }}
                />
              )}
              contentContainerStyle={{ paddingBottom: insets.bottom + 64 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={T.primary}
                  colors={[T.primary]}
                />
              }
            />
          </>
        )}
      </View>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 36,
    paddingTop: 24,
    position: 'relative',
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 8,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    color: T.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  body: { flex: 1, paddingHorizontal: 24 },
  requestsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 16,
  },
  requestsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  requestsLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textDim,
  },
  badge: {
    width: 18,
    height: 18,
    backgroundColor: T.primary,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: F.mono,
    fontSize: 9,
    color: T.text,
  },
  requestsArrow: {
    fontFamily: F.mono,
    fontSize: 20,
    color: T.textFaint,
  },
  searchInputContainer: {
    marginBottom: 16,
  },
  searchNoResult: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
    marginBottom: 16,
  },
  searchResults: {
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.primary,
  },
  searchResultInfo: { flex: 1 },
  resultName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
  },
  resultUsername: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    marginTop: 2,
  },
  alreadyFriend: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 4,
  },
  addBtnText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.text,
  },
  loader: { marginTop: 32 },
  skeletonList: { marginTop: 8 },
  empty: { paddingTop: 40, alignItems: 'center' },
  emptyTitle: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 28,
    color: T.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
  },
  snackbar: { backgroundColor: T.surface2 },
  sectionLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 8,
    marginTop: 4,
  },
  requestsValue: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: T.textFaint,
  },
  cercleSectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 0,
  },
  cercleSectionLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  cercleSectionCount: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.textFaint,
  },
});

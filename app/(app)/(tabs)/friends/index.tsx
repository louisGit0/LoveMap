import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useFriendStore } from '@/stores/friendStore';
import { useMapStore } from '@/stores/mapStore';
import { useTheme } from '@/hooks/useTheme';
import { FriendItem } from '@/components/friends/FriendItem';
import { SkeletonRow } from '@/components/ui/SkeletonItem';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoSearch, IcoPlus } from '@/components/icons';
import type { Profile } from '@/types/app.types';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { friends, fetchFriends, sendFriendRequest, unfriend, setPendingReceived } = useFriends();
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

  const loadFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const ok = await fetchFriends(user.id);
    if (!ok) { setLoading(false); setSnackbar('Erreur de chargement.'); return; }
    const { data } = await supabase
      .from('friendships')
      .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');
    if (data) {
      setPendingReceived(data.map((f: any) => ({ ...f, profile: f.requester })));
    }
    setLoading(false);
  }, [user, fetchFriends, setPendingReceived]);

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
      const { data } = await supabase.rpc('search_users', { query: searchQuery.trim() });
      setSearchResults((data ?? []) as Profile[]);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    if (!ok) setSnackbar('Erreur lors de la suppression.');
  }

  const alreadyFriendIds = new Set(friends.map((f) => f.profile.id));

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Confidents</Text>
        <Text style={styles.title}>le cercle</Text>
        <Text style={styles.subtitle}>
          {friends.length} lien{friends.length > 1 ? 's' : ''} · {pendingReceived.length} demande{pendingReceived.length > 1 ? 's' : ''}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Section inviter */}
        <Text style={styles.sectionLabel}>Inviter quelqu'un</Text>
        <View style={styles.searchRow}>
          <IcoSearch size={14} color={T.textFaint} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="@pseudo ou prénom"
            placeholderTextColor={T.textFaint}
            autoCapitalize="none"
          />
          {searchLoading && <ActivityIndicator color={T.primary} size="small" />}
        </View>

        {/* Section demandes */}
        <TouchableOpacity
          style={styles.requestsRow}
          onPress={() => router.push('/(app)/friends/requests')}
          activeOpacity={0.75}
        >
          <View style={styles.requestsLeft}>
            <Text style={styles.requestsLabel}>Demandes</Text>
            {pendingReceived.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingReceived.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.requestsValue}>
            {pendingReceived.length === 0 ? 'aucune pour l\'instant' : `${pendingReceived.length} en attente`}
          </Text>
          <Text style={styles.requestsArrow}>›</Text>
        </TouchableOpacity>

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
            <Text style={styles.emptyTitle}>Le cercle est vide.</Text>
            <Text style={styles.emptySubtitle}>Vous ne pouvez pas cartographier vos moments en étant seul·e. Invitez quelqu'un en qui vous avez confiance.</Text>
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
              contentContainerStyle={styles.listContent}
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
    fontSize: 56,
    lineHeight: 54,
    letterSpacing: -2,
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
    fontFamily: F.sansLight,
    fontSize: 20,
    color: T.textFaint,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 8,
    gap: 10,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
    paddingVertical: 6,
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
    fontFamily: F.sans,
    fontSize: 14,
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
    fontFamily: F.sansMedium,
    fontSize: 11,
    letterSpacing: 0.5,
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
  listContent: { paddingBottom: 100 },
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

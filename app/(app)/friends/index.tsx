import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useFriendStore } from '@/stores/friendStore';
import { Input } from '@/components/ui/Input';
import { FriendItem } from '@/components/friends/FriendItem';
import { T } from '@/constants/theme';
import type { Profile } from '@/types/app.types';

export default function FriendsScreen() {
  const { user } = useAuth();
  const { friends, fetchFriends, sendFriendRequest, unfriend, setPendingReceived } = useFriends();
  const pendingReceived = useFriendStore((s) => s.pendingReceived);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    await fetchFriends(user.id);
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

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
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
      setSnackbar(`Demande envoyée à ${profile.display_name ?? profile.username} !`);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      setSnackbar('Erreur lors de l\'envoi de la demande.');
    }
  }

  async function handleUnfriend(friendshipId: string) {
    const ok = await unfriend(friendshipId);
    if (!ok) setSnackbar('Erreur lors de la suppression.');
  }

  const alreadyFriendIds = new Set(friends.map((f) => f.profile.id));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cercle</Text>
      <Text style={styles.subtitle}>{friends.length} amis</Text>

      <View style={styles.searchContainer}>
        <Input
          label=""
          placeholder="Rechercher par @pseudo"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          right={searchLoading ? <ActivityIndicator color={T.primary} size="small" /> : undefined}
        />
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((u) => (
              <View key={u.id} style={styles.searchResultItem}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{(u.display_name ?? u.username)[0].toUpperCase()}</Text>
                </View>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.resultName}>{u.display_name}</Text>
                  <Text style={styles.resultUsername}>@{u.username}</Text>
                </View>
                {!alreadyFriendIds.has(u.id) && (
                  <TouchableOpacity style={styles.addButton} onPress={() => handleAdd(u)} activeOpacity={0.8}>
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </TouchableOpacity>
                )}
                {alreadyFriendIds.has(u.id) && (
                  <Text style={styles.alreadyFriendText}>Ami ✓</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={styles.requestsButton}
        onPress={() => router.push('/(app)/friends/requests')}
        activeOpacity={0.8}
      >
        <Text style={styles.requestsButtonText}>
          Demandes reçues{pendingReceived.length > 0 ? ` · ${pendingReceived.length}` : ''}
        </Text>
        {pendingReceived.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingReceived.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={T.primary} style={styles.loader} />
      ) : friends.length === 0 ? (
        <Text style={styles.emptyText}>Pas encore d'amis. Recherchez par pseudo !</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendItem friend={item} onUnfriend={() => handleUnfriend(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    paddingTop: 56,
    paddingHorizontal: 24,
  },
  title: {
    color: T.text,
    fontSize: 40,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: -1.5,
  },
  subtitle: {
    color: T.textDim,
    fontSize: 13,
    marginBottom: 20,
    marginTop: 2,
  },
  searchContainer: {
    marginBottom: 14,
  },
  searchResults: {
    backgroundColor: T.surface,
    borderRadius: T.cardRadius,
    borderWidth: 1,
    borderColor: T.border,
    marginTop: 6,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: T.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: T.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  searchResultInfo: { flex: 1 },
  resultName: {
    color: T.text,
    fontSize: 14,
    fontWeight: '500',
  },
  resultUsername: {
    color: T.textDim,
    fontSize: 12,
  },
  addButton: {
    backgroundColor: T.primary,
    borderRadius: T.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  alreadyFriendText: {
    color: T.success,
    fontSize: 13,
    fontWeight: '500',
  },
  requestsButton: {
    backgroundColor: T.surface,
    borderRadius: T.cardRadius,
    borderWidth: 1,
    borderColor: T.primary + '44',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  requestsButtonText: {
    color: T.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  badge: {
    backgroundColor: T.primary,
    borderRadius: T.pill,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  loader: { marginTop: 32 },
  emptyText: {
    color: T.textDim,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
    lineHeight: 22,
  },
  listContent: { paddingBottom: 24 },
  snackbar: { backgroundColor: T.surface2 },
});

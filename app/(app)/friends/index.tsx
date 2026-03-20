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

    // Charger les demandes reçues
    const { data } = await supabase
      .from('friendships')
      .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (data) {
      setPendingReceived(
        data.map((f: any) => ({ ...f, profile: f.requester }))
      );
    }

    setLoading(false);
  }, [user, fetchFriends, setPendingReceived]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  // Debounce search
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
      <Text style={styles.title}>Amis</Text>

      {/* Recherche */}
      <View style={styles.searchContainer}>
        <Input
          label="Rechercher par @pseudo"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          right={searchLoading ? <ActivityIndicator color="#e91e8c" size="small" /> : undefined}
        />
        {searchResults.length > 0 && (
          <View style={styles.searchResults}>
            {searchResults.map((u) => (
              <View key={u.id} style={styles.searchResultItem}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(u.display_name ?? u.username)[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.searchResultInfo}>
                  <Text style={styles.resultName}>{u.display_name}</Text>
                  <Text style={styles.resultUsername}>@{u.username}</Text>
                </View>
                {!alreadyFriendIds.has(u.id) && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAdd(u)}
                    activeOpacity={0.8}
                  >
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

      {/* Bouton demandes */}
      <TouchableOpacity
        style={styles.requestsButton}
        onPress={() => router.push('/(app)/friends/requests')}
        activeOpacity={0.8}
      >
        <Text style={styles.requestsButtonText}>
          Demandes reçues{pendingReceived.length > 0 ? ` (${pendingReceived.length})` : ''}
        </Text>
      </TouchableOpacity>

      {/* Liste amis */}
      {loading ? (
        <ActivityIndicator color="#e91e8c" style={styles.loader} />
      ) : friends.length === 0 ? (
        <Text style={styles.emptyText}>Vous n'avez pas encore d'amis. Recherchez par pseudo !</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendItem
              friend={item}
              onUnfriend={() => handleUnfriend(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
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
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchResults: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 4,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 15,
  },
  searchResultInfo: {
    flex: 1,
  },
  resultName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  resultUsername: {
    color: '#888888',
    fontSize: 12,
  },
  addButton: {
    backgroundColor: '#e91e8c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  alreadyFriendText: {
    color: '#4caf50',
    fontSize: 13,
  },
  requestsButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e91e8c44',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  requestsButtonText: {
    color: '#e91e8c',
    fontWeight: '600',
    fontSize: 14,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    color: '#888888',
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 24,
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

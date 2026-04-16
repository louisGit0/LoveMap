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

type ActiveTab = 'amis' | 'messages';

interface ConversationSummary {
  userId: string;
  profile: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function SocialScreen() {
  const { user } = useAuth();
  const { friends, fetchFriends, sendFriendRequest, unfriend, setPendingReceived } = useFriends();
  const pendingReceived = useFriendStore((s) => s.pendingReceived);

  const [activeTab, setActiveTab] = useState<ActiveTab>('amis');

  // Onglet Amis
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Onglet Messages
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadFriends = useCallback(async () => {
    if (!user) return;
    setLoadingFriends(true);
    await fetchFriends(user.id);

    const { data } = await supabase
      .from('friendships')
      .select(
        `*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`
      )
      .eq('addressee_id', user.id)
      .eq('status', 'pending');

    if (data) {
      setPendingReceived(data.map((f: Record<string, unknown>) => ({ ...f, profile: f['requester'] })));
    }
    setLoadingFriends(false);
  }, [user, fetchFriends, setPendingReceived]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingMessages(true);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) {
      setLoadingMessages(false);
      return;
    }

    // Regrouper par conversation (l'autre utilisateur)
    const convMap = new Map<string, ConversationSummary>();
    for (const msg of msgs) {
      const otherId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!convMap.has(otherId)) {
        convMap.set(otherId, {
          userId: otherId,
          profile: {} as Profile,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
          unreadCount: msg.recipient_id === user.id && !msg.read_at ? 1 : 0,
        });
      } else {
        const conv = convMap.get(otherId)!;
        if (msg.recipient_id === user.id && !msg.read_at) {
          convMap.set(otherId, { ...conv, unreadCount: conv.unreadCount + 1 });
        }
      }
    }

    // Charger les profils des interlocuteurs
    const otherIds = Array.from(convMap.keys());
    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', otherIds);

      if (profiles) {
        for (const p of profiles) {
          const conv = convMap.get(p.id);
          if (conv) convMap.set(p.id, { ...conv, profile: p as Profile });
        }
      }
    }

    setConversations(Array.from(convMap.values()));
    setLoadingMessages(false);
  }, [user]);

  useEffect(() => {
    loadFriends();
  }, [loadFriends]);

  useEffect(() => {
    if (activeTab === 'messages') loadConversations();
  }, [activeTab, loadConversations]);

  // Recherche amis debounce
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
      setSnackbar("Erreur lors de l'envoi de la demande.");
    }
  }

  async function handleUnfriend(friendshipId: string) {
    const ok = await unfriend(friendshipId);
    if (!ok) setSnackbar('Erreur lors de la suppression.');
  }

  const alreadyFriendIds = new Set(friends.map((f) => f.profile.id));

  function formatMessageDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Social</Text>

      {/* Toggle tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'amis' && styles.tabActive]}
          onPress={() => setActiveTab('amis')}
        >
          <Text style={[styles.tabText, activeTab === 'amis' && styles.tabTextActive]}>
            Amis {pendingReceived.length > 0 ? `(${pendingReceived.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── Onglet Amis ─── */}
      {activeTab === 'amis' && (
        <View style={styles.tabContent}>
          <View style={styles.searchContainer}>
            <Input
              label="Rechercher par @pseudo"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
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
                    {!alreadyFriendIds.has(u.id) ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => handleAdd(u)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addButtonText}>Ajouter</Text>
                      </TouchableOpacity>
                    ) : (
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
              Demandes reçues{pendingReceived.length > 0 ? ` (${pendingReceived.length})` : ''}
            </Text>
          </TouchableOpacity>

          {loadingFriends ? (
            <ActivityIndicator color="#e91e8c" style={styles.loader} />
          ) : friends.length === 0 ? (
            <Text style={styles.emptyText}>
              Vous n'avez pas encore d'amis. Recherchez par pseudo !
            </Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.friendRow}>
                  <View style={styles.friendItemWrapper}>
                    <FriendItem
                      friend={item}
                      onUnfriend={() => handleUnfriend(item.id)}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.viewMapButton}
                    onPress={() =>
                      router.push(`/(app)/social/friend-map/${item.profile.id}`)
                    }
                    activeOpacity={0.8}
                  >
                    <Text style={styles.viewMapButtonText}>🗺 Sa carte</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      )}

      {/* ─── Onglet Messages ─── */}
      {activeTab === 'messages' && (
        <View style={styles.tabContent}>
          {loadingMessages ? (
            <ActivityIndicator color="#e91e8c" style={styles.loader} />
          ) : conversations.length === 0 ? (
            <Text style={styles.emptyText}>
              Aucune conversation. Retrouvez vos amis dans l'onglet "Amis" pour leur écrire.
            </Text>
          ) : (
            <FlatList
              data={conversations}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.convRow}
                  onPress={() =>
                    router.push(`/(app)/social/messages/${item.userId}`)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {(item.profile.display_name ?? item.profile.username ?? '?')[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.convInfo}>
                    <Text style={styles.convName}>
                      {item.profile.display_name ?? item.profile.username}
                    </Text>
                    <Text style={styles.convLastMessage} numberOfLines={1}>
                      {item.lastMessage}
                    </Text>
                  </View>
                  <View style={styles.convMeta}>
                    <Text style={styles.convDate}>
                      {formatMessageDate(item.lastMessageAt)}
                    </Text>
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
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
  },
  title: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#e91e8c',
  },
  tabText: {
    color: '#888888',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 16,
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
  friendRow: {
    marginBottom: 8,
  },
  friendItemWrapper: {
    marginBottom: 0,
  },
  viewMapButton: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginRight: 4,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  viewMapButtonText: {
    color: '#888888',
    fontSize: 12,
    fontWeight: '500',
  },
  // Conversations
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  convInfo: {
    flex: 1,
  },
  convName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  convLastMessage: {
    color: '#888888',
    fontSize: 13,
  },
  convMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  convDate: {
    color: '#555',
    fontSize: 11,
  },
  unreadBadge: {
    backgroundColor: '#e91e8c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

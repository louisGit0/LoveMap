import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Profile } from '@/types/app.types';

interface ConversationSummary {
  userId: string;
  profile: Profile;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function MessagesListScreen() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!msgs) {
      setLoading(false);
      return;
    }

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
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();

    // Realtime — rafraîchir à chaque nouveau message reçu
    if (!user) return;
    const channel = supabase
      .channel('messages-list')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${user.id}` },
        () => loadConversations()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadConversations, user]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <ActivityIndicator color="#e91e8c" style={styles.loader} />
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Aucune conversation. Retrouvez vos amis dans l'onglet Social pour leur écrire.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.convRow}
              onPress={() => router.push(`/(app)/social/messages/${item.userId}`)}
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
                <Text style={styles.convDate}>{formatDate(item.lastMessageAt)}</Text>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingTop: 56,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  backButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  title: {
    flex: 1,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 70,
  },
  loader: {
    marginTop: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 18,
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
});

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
import { FriendRequestItem } from '@/components/friends/FriendRequestItem';
import type { FriendWithProfile } from '@/types/app.types';

export default function FriendRequests() {
  const { user } = useAuth();
  const { respondToRequest, setPendingReceived, setPendingSent } = useFriends();

  const [received, setReceived] = useState<FriendWithProfile[]>([]);
  const [sent, setSent] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [receivedRes, sentRes] = await Promise.all([
      supabase
        .from('friendships')
        .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
        .eq('addressee_id', user.id)
        .eq('status', 'pending'),
      supabase
        .from('friendships')
        .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
        .eq('requester_id', user.id)
        .eq('status', 'pending'),
    ]);

    const receivedData: FriendWithProfile[] = (receivedRes.data ?? []).map((f: any) => ({
      ...f,
      profile: f.requester,
    }));
    const sentData: FriendWithProfile[] = (sentRes.data ?? []).map((f: any) => ({
      ...f,
      profile: f.addressee,
    }));

    setReceived(receivedData);
    setSent(sentData);
    setPendingReceived(receivedData);
    setPendingSent(sentData);
    setLoading(false);
  }, [user, setPendingReceived, setPendingSent]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  async function handleRespond(friendshipId: string, accept: boolean) {
    const ok = await respondToRequest(friendshipId, accept ? 'accepted' : 'rejected');
    if (ok) {
      setSnackbar(accept ? 'Demande acceptée !' : 'Demande refusée.');
      await loadRequests();
    } else {
      setSnackbar('Erreur lors de la réponse.');
    }
  }

  async function handleCancel(friendshipId: string) {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (!error) {
      setSnackbar('Demande annulée.');
      await loadRequests();
    } else {
      setSnackbar('Erreur lors de l\'annulation.');
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Demandes d'amitié</Text>

      {loading ? (
        <ActivityIndicator color="#e91e8c" style={styles.loader} />
      ) : (
        <>
          {/* Reçues */}
          <Text style={styles.sectionTitle}>
            Demandes reçues {received.length > 0 ? `(${received.length})` : ''}
          </Text>
          {received.length === 0 ? (
            <Text style={styles.emptyText}>Aucune demande reçue.</Text>
          ) : (
            <FlatList
              data={received}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FriendRequestItem
                  request={item}
                  onAccept={() => handleRespond(item.id, true)}
                  onReject={() => handleRespond(item.id, false)}
                />
              )}
              scrollEnabled={false}
            />
          )}

          {/* Envoyées */}
          <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>
            Demandes envoyées
          </Text>
          {sent.length === 0 ? (
            <Text style={styles.emptyText}>Aucune demande envoyée.</Text>
          ) : (
            <FlatList
              data={sent}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.sentItem}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {(item.profile.display_name ?? item.profile.username)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.sentInfo}>
                    <Text style={styles.sentName}>
                      {item.profile.display_name ?? item.profile.username}
                    </Text>
                    <Text style={styles.sentUsername}>@{item.profile.username}</Text>
                  </View>
                  <View style={styles.sentMeta}>
                    <Text style={styles.pendingLabel}>En attente</Text>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancel(item.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelButtonText}>Annuler</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </>
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
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#e91e8c',
    fontSize: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionTitleMargin: {
    marginTop: 24,
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 8,
  },
  sentItem: {
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9c27b033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#9c27b0',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sentInfo: {
    flex: 1,
  },
  sentName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  sentUsername: {
    color: '#888888',
    fontSize: 12,
  },
  sentMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  pendingLabel: {
    color: '#ff9800',
    fontSize: 11,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cancelButtonText: {
    color: '#888888',
    fontSize: 12,
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

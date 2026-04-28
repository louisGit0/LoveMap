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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { FriendRequestItem } from '@/components/friends/FriendRequestItem';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoArrow, IcoClose } from '@/components/icons';
import type { FriendWithProfile } from '@/types/app.types';

export default function FriendRequests() {
  const insets = useSafeAreaInsets();
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

    const receivedData: FriendWithProfile[] = (receivedRes.data ?? []).map((f: any) => ({ ...f, profile: f.requester }));
    const sentData: FriendWithProfile[] = (sentRes.data ?? []).map((f: any) => ({ ...f, profile: f.addressee }));

    setReceived(receivedData);
    setSent(sentData);
    setPendingReceived(receivedData);
    setPendingSent(sentData);
    setLoading(false);
  }, [user, setPendingReceived, setPendingSent]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleRespond(friendshipId: string, accept: boolean) {
    const ok = await respondToRequest(friendshipId, accept ? 'accepted' : 'rejected');
    if (ok) {
      setSnackbar(accept ? 'Demande acceptée.' : 'Demande refusée.');
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
      setSnackbar("Erreur lors de l'annulation.");
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Retour */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <IcoArrow size={16} color={T.primary} dir="left" />
        <Text style={styles.backText}>le cercle</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Demandes</Text>

      {loading ? (
        <ActivityIndicator color={T.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Section reçues */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>↓ Reçues</Text>
                <Text style={styles.sectionCount}>{String(received.length).padStart(2, '0')}</Text>
              </View>
              {received.length === 0 ? (
                <Text style={styles.emptyText}>Aucune demande reçue.</Text>
              ) : (
                received.map((item) => (
                  <FriendRequestItem
                    key={item.id}
                    request={item}
                    onAccept={() => handleRespond(item.id, true)}
                    onReject={() => handleRespond(item.id, false)}
                  />
                ))
              )}

              {/* Section envoyées */}
              <View style={[styles.sectionHeader, styles.sectionHeaderMargin]}>
                <Text style={styles.sectionEyebrow}>↑ Envoyées</Text>
                <Text style={styles.sectionCount}>{String(sent.length).padStart(2, '0')}</Text>
              </View>
              {sent.length === 0 ? (
                <Text style={styles.emptyText}>Aucune demande envoyée.</Text>
              ) : (
                sent.map((item) => (
                  <View key={item.id} style={styles.sentItem}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarInitial}>
                        {(item.profile.display_name ?? item.profile.username)[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.sentInfo}>
                      <Text style={styles.sentName}>{item.profile.display_name ?? item.profile.username}</Text>
                      <Text style={styles.sentUsername}>@{item.profile.username}</Text>
                    </View>
                    <View style={styles.sentMeta}>
                      <Text style={styles.pendingLabel}>En attente</Text>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)} activeOpacity={0.7}>
                        <IcoClose size={12} color={T.textFaint} />
                        <Text style={styles.cancelBtnText}>Annuler</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg, paddingHorizontal: 24 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  backText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.primary,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 44,
    lineHeight: 42,
    letterSpacing: -1.5,
    color: T.text,
    marginBottom: 24,
  },
  loader: { marginTop: 32 },
  listContent: { paddingBottom: 100 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 8,
    marginBottom: 12,
  },
  sectionHeaderMargin: { marginTop: 32 },
  sectionEyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  sectionCount: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.textFaint,
  },
  emptyText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
    paddingVertical: 12,
  },
  sentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
  sentInfo: { flex: 1 },
  sentName: {
    fontFamily: F.sans,
    fontSize: 14,
    color: T.text,
  },
  sentUsername: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    marginTop: 2,
  },
  sentMeta: { alignItems: 'flex-end', gap: 6 },
  pendingLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cancelBtnText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  snackbar: { backgroundColor: T.surface2 },
});

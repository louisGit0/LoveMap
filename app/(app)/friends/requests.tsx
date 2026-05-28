import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useTheme } from '@/hooks/useTheme';
import { FriendRequestItem } from '@/components/friends/FriendRequestItem';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoArrow, IcoClose } from '@/components/icons';
import type { FriendWithProfile } from '@/types/app.types';

interface PendingTag {
  id: string;
  point_id: string;
  notified_at: string | null;
  points: {
    note: number;
    happened_at: string | null;
    created_at: string;
    comment: string | null;
  } | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function FriendRequests() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { respondToRequest, setPendingReceived, setPendingSent } = useFriends();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [received, setReceived] = useState<FriendWithProfile[]>([]);
  const [sent, setSent] = useState<FriendWithProfile[]>([]);
  const [pendingTags, setPendingTags] = useState<PendingTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [receivedRes, sentRes, tagsRes] = await Promise.all([
      // Demandes d'amitié reçues
      supabase
        .from('friendships')
        .select(`
          id, requester_id, addressee_id, status, created_at, updated_at,
          profile:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending'),

      // Demandes d'amitié envoyées
      supabase
        .from('friendships')
        .select(`
          id, requester_id, addressee_id, status, created_at, updated_at,
          profile:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending'),

      // Taguages en attente de consentement (où je suis le partenaire)
      // Nécessite migration 010 : la RLS points_select autorise désormais le partenaire tagué
      supabase
        .from('point_partners')
        .select(`
          id,
          point_id,
          notified_at,
          points (
            note,
            happened_at,
            created_at,
            comment
          )
        `)
        .eq('partner_id', user.id)
        .eq('status', 'pending'),
    ]);

    const receivedData = (receivedRes.data ?? []) as unknown as FriendWithProfile[];
    const sentData = (sentRes.data ?? []) as unknown as FriendWithProfile[];
    const tagsData = (tagsRes.data ?? []) as unknown as PendingTag[];

    setReceived(receivedData);
    setSent(sentData);
    setPendingTags(tagsData);
    setPendingReceived(receivedData);
    setPendingSent(sentData);
    setLoading(false);
  }, [user, setPendingReceived, setPendingSent]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleRespond(friendshipId: string, accept: boolean) {
    const ok = await respondToRequest(friendshipId, accept ? 'accepted' : 'rejected');
    if (ok) {
      if (accept) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
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
              {/* ── Taguages en attente de consentement ── */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Taguages</Text>
                <Text style={styles.sectionCount}>{String(pendingTags.length).padStart(2, '0')}</Text>
              </View>
              {pendingTags.length === 0 ? (
                <Text style={styles.emptyText}>Aucun taguage en attente.</Text>
              ) : (
                pendingTags.map((tag) => {
                  const p = tag.points;
                  const dateStr = formatDate(p?.happened_at ?? p?.created_at);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={styles.tagItem}
                      onPress={() => router.push(`/(app)/point/${tag.point_id}`)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.tagNoteBox}>
                        <Text style={styles.tagNote}>{p?.note ?? '—'}</Text>
                        <Text style={styles.tagNoteDenom}>/10</Text>
                      </View>
                      <View style={styles.tagInfo}>
                        <Text style={styles.tagLabel}>Vous avez été mentionné·e</Text>
                        <Text style={styles.tagDate}>{dateStr}</Text>
                        {p?.comment ? (
                          <Text style={styles.tagComment} numberOfLines={1}>
                            {p.comment}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.tagCta}>
                        <Text style={styles.tagCtaText}>Répondre</Text>
                        <Text style={styles.tagCtaArrow}>→</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}

              {/* ── Demandes d'amitié reçues ── */}
              <View style={[styles.sectionHeader, styles.sectionHeaderMargin]}>
                <Text style={styles.sectionEyebrow}>↓ Reçues</Text>
                <Text style={styles.sectionCount}>{String(received.length).padStart(2, '0')}</Text>
              </View>
              {received.length === 0 ? (
                <Text style={styles.emptyText}>Aucune demande reçue.</Text>
              ) : (
                received.map((item) => {
                  if (!item.profile) return null;
                  return (
                    <FriendRequestItem
                      key={item.id}
                      request={item}
                      onAccept={() => handleRespond(item.id, true)}
                      onReject={() => handleRespond(item.id, false)}
                    />
                  );
                })
              )}

              {/* ── Demandes d'amitié envoyées ── */}
              <View style={[styles.sectionHeader, styles.sectionHeaderMargin]}>
                <Text style={styles.sectionEyebrow}>↑ Envoyées</Text>
                <Text style={styles.sectionCount}>{String(sent.length).padStart(2, '0')}</Text>
              </View>
              {sent.length === 0 ? (
                <Text style={styles.emptyText}>Aucune demande envoyée.</Text>
              ) : (
                sent.map((item) => {
                  if (!item.profile) return null;
                  const displayName = item.profile.display_name ?? item.profile.username;
                  const initial = displayName?.[0]?.toUpperCase() ?? '?';
                  return (
                    <View key={item.id} style={styles.sentItem}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarInitial}>{initial}</Text>
                      </View>
                      <View style={styles.sentInfo}>
                        <Text style={styles.sentName}>{displayName}</Text>
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
                  );
                })
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

const makeStyles = (T: Theme) => StyleSheet.create({
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

  /* ── Taguage en attente ── */
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 14,
  },
  tagNoteBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    width: 44,
  },
  tagNote: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 34,
    color: T.primary,
    letterSpacing: -1,
  },
  tagNoteDenom: {
    fontFamily: F.mono,
    fontSize: 9,
    color: T.textFaint,
    marginLeft: 1,
    marginBottom: 4,
  },
  tagInfo: { flex: 1 },
  tagLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.text,
    marginBottom: 2,
  },
  tagDate: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  tagComment: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 12,
    color: T.textDim,
    marginTop: 4,
  },
  tagCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: T.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tagCtaText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.primary,
  },
  tagCtaArrow: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.primary,
  },

  /* ── Demandes envoyées ── */
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

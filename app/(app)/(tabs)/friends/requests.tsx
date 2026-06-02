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
import { haptics } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { useTheme } from '@/hooks/useTheme';
import { FriendRequestItem } from '@/components/friends/FriendRequestItem';
import { Button } from '@/components/ui/Button';
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
  const { respondToRequest, respondToTag, setPendingReceived, setPendingSent } = useFriends();
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
        haptics.success();
      } else {
        haptics.warn();
      }
      setSnackbar(accept ? 'Demande acceptée.' : 'Demande refusée.');
      await loadRequests();
    } else {
      haptics.error();
      setSnackbar('Action impossible. Réessayez.');
    }
  }

  // Consentement de taguage INLINE (D-08) — passe par le hook respondToTag (pas de Supabase ici,
  // pas de navigation vers le détail du point). is_visible bascule server-side via trigger.
  async function handleRespondTag(pointPartnerId: string, accept: boolean) {
    const ok = await respondToTag(pointPartnerId, accept);
    if (ok) {
      if (accept) {
        haptics.success();
      } else {
        haptics.warn();
      }
      setSnackbar(accept ? 'Page scellée.' : 'Taguage refusé.');
      await loadRequests();
    } else {
      haptics.error();
      setSnackbar('Action impossible. Réessayez.');
    }
  }

  // ⚠ Déviation rule-4 existante NON corrigée cette phase : appel Supabase direct dans le composant
  // pour la section discrète « Envoyées » (annulation d'une demande envoyée). Laissé inchangé pour
  // ne pas étendre la dette ni élargir le périmètre 04-03 (cf. SUMMARY). À router via un hook ultérieurement.
  async function handleCancel(friendshipId: string) {
    const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
    if (!error) {
      setSnackbar('Demande annulée.');
      await loadRequests();
    } else {
      setSnackbar("Erreur lors de l'annulation.");
    }
  }

  const bothMainEmpty = received.length === 0 && pendingTags.length === 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Retour */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <IcoArrow size={16} color={T.primary} dir="left" />
        <Text style={styles.backText}>le cercle</Text>
      </TouchableOpacity>

      <Text style={styles.title} maxFontSizeMultiplier={1.25}>Demandes</Text>

      {loading ? (
        <ActivityIndicator color={T.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {bothMainEmpty ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Pas de page en attente.</Text>
                </View>
              ) : (
                <>
                  {/* ── Section A : Demandes d'amitié reçues ── */}
                  {received.length > 0 && (
                    <>
                      <View style={styles.sectionHeader}>
                        <Text style={styles.sectionEyebrow}>Demandes reçues</Text>
                        <Text style={styles.sectionCount}>
                          {String(received.length).padStart(2, '0')}
                        </Text>
                      </View>
                      {received.map((item) => {
                        if (!item.profile) return null;
                        return (
                          <FriendRequestItem
                            key={item.id}
                            request={item}
                            affirmLabel="Accepter"
                            negativeLabel="Refuser"
                            onAffirm={() => handleRespond(item.id, true)}
                            onNegative={() => handleRespond(item.id, false)}
                          />
                        );
                      })}
                    </>
                  )}

                  {/* ── Section B : Taguages en attente (consentement partenaire, inline) ── */}
                  {pendingTags.length > 0 && (
                    <>
                      <View style={[styles.sectionHeader, received.length > 0 && styles.sectionHeaderMargin]}>
                        <Text style={styles.sectionEyebrow}>Taguages en attente</Text>
                        <Text style={styles.sectionCount}>
                          {String(pendingTags.length).padStart(2, '0')}
                        </Text>
                      </View>
                      {pendingTags.map((tag) => {
                        const p = tag.points;
                        const dateStr = formatDate(p?.happened_at ?? p?.created_at);
                        return (
                          <View key={tag.id} style={styles.tagItem}>
                            <View style={styles.tagNoteBox}>
                              <Text style={styles.tagNote}>{p?.note ?? '—'}</Text>
                              <Text style={styles.tagNoteDenom}>/10</Text>
                            </View>
                            <View style={styles.tagInfo}>
                              <Text style={styles.tagLabel} numberOfLines={1}>
                                {p?.comment ?? 'Vous avez été mentionné·e'}
                              </Text>
                              <Text style={styles.tagDate}>{dateStr}</Text>
                            </View>
                            <View style={styles.actions}>
                              <Button
                                variant="coral"
                                fullWidth={false}
                                onPress={() => handleRespondTag(tag.id, true)}
                                style={styles.affirmBtn}
                              >
                                <Text style={styles.affirmLabel}>Sceller</Text>
                              </Button>
                              <Button
                                variant="ghost"
                                fullWidth={false}
                                onPress={() => handleRespondTag(tag.id, false)}
                                style={styles.negativeBtn}
                              >
                                <Text style={styles.negativeLabel}>Décliner</Text>
                              </Button>
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}
                </>
              )}

              {/* ── Section C : Envoyées (discrète, D-09) ── */}
              {sent.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, styles.sectionHeaderMargin]}>
                    <Text style={styles.sectionEyebrowDiscreet}>Envoyées</Text>
                    <Text style={styles.sectionCount}>{String(sent.length).padStart(2, '0')}</Text>
                  </View>
                  {sent.map((item) => {
                    if (!item.profile) return null;
                    const displayName = item.profile.display_name ?? item.profile.username;
                    const initial = displayName?.[0]?.toUpperCase() ?? '?';
                    return (
                      <View key={item.id} style={styles.sentItem}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarInitial}>{initial}</Text>
                        </View>
                        <View style={styles.sentInfo}>
                          <Text style={styles.sentName} numberOfLines={1}>{displayName}</Text>
                          <Text style={styles.sentUsername}>@{item.profile.username}</Text>
                        </View>
                        <View style={styles.sentMeta}>
                          <Text style={styles.pendingLabel}>En attente</Text>
                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => handleCancel(item.id)}
                            activeOpacity={0.7}
                          >
                            <IcoClose size={12} color={T.textFaint} />
                            <Text style={styles.cancelBtnText}>Annuler</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </>
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + 64 }}
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
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    color: T.text,
    marginBottom: 24,
  },
  loader: { marginTop: 32 },
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
  sectionEyebrowDiscreet: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    opacity: 0.7,
  },
  sectionCount: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.textFaint,
  },

  /* ── Empty state (deux sections principales vides) ── */
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
  },
  emptyStateText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.textFaint,
    textAlign: 'center',
  },

  /* ── Boutons texte d'action (amitié + taguage), D-12 ── */
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  affirmBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  affirmLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
  },
  negativeBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  negativeLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textDim,
  },

  /* ── Taguage en attente ── */
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
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
  tagInfo: { flex: 1, minWidth: 0 },
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
  sentInfo: { flex: 1, minWidth: 0 },
  sentName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: T.textDim,
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

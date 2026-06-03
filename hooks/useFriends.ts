import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useFriendStore } from '@/stores/friendStore';
import type { FriendWithProfile, Profile, PendingTag } from '@/types/app.types';

export interface BlockedUser {
  block_id: string;
  blocked_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function useFriends() {
  const { friends, pendingReceived, pendingSent, setFriends, setPendingReceived, setPendingSent, removeFriend } =
    useFriendStore();

  const fetchFriends = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:profiles!friendships_requester_id_fkey(*),
        addressee:profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('[useFriends] fetchFriends error:', error.message);
      return false;
    }

    const enriched: FriendWithProfile[] = (data ?? []).map((f: any) => ({
      ...f,
      profile: f.requester_id === userId ? f.addressee : f.requester,
    }));

    setFriends(enriched);
    return true;
  }, [setFriends]);

  const sendFriendRequest = useCallback(async (requesterId: string, addresseeId: string) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ requester_id: requesterId, addressee_id: addresseeId });

    if (error) {
      console.error('[useFriends] sendFriendRequest error:', error.message);
      return false;
    }
    return true;
  }, []);

  const respondToRequest = useCallback(async (
    friendshipId: string,
    response: 'accepted' | 'rejected'
  ) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: response, updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) {
      console.error('[useFriends] respondToRequest error:', error.message);
      return false;
    }
    return true;
  }, []);

  // Demandes d'amitié reçues en attente (pour le badge / l'aperçu du cercle).
  const fetchPendingReceived = useCallback(async (userId: string): Promise<FriendWithProfile[]> => {
    const { data, error } = await supabase
      .from('friendships')
      .select(`*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)`)
      .eq('addressee_id', userId)
      .eq('status', 'pending');
    if (error) {
      console.error('[useFriends] fetchPendingReceived error:', error.message);
      return [];
    }
    return (data ?? []).map((f: any) => ({ ...f, profile: f.requester }));
  }, []);

  // Écran Demandes : reçues + envoyées (amitié) + taguages en attente (consentement partenaire).
  const fetchRequests = useCallback(async (
    userId: string
  ): Promise<{ received: FriendWithProfile[]; sent: FriendWithProfile[]; pendingTags: PendingTag[] } | null> => {
    const [receivedRes, sentRes, tagsRes] = await Promise.all([
      supabase
        .from('friendships')
        .select(`
          id, requester_id, addressee_id, status, created_at, updated_at,
          profile:profiles!friendships_requester_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('addressee_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('friendships')
        .select(`
          id, requester_id, addressee_id, status, created_at, updated_at,
          profile:profiles!friendships_addressee_id_fkey(id, username, display_name, avatar_url)
        `)
        .eq('requester_id', userId)
        .eq('status', 'pending'),
      // Taguages en attente (migration 010 : RLS points_select autorise le partenaire tagué)
      supabase
        .from('point_partners')
        .select(`id, point_id, notified_at, points ( note, happened_at, created_at, comment )`)
        .eq('partner_id', userId)
        .eq('status', 'pending'),
    ]);

    if (receivedRes.error || sentRes.error || tagsRes.error) {
      console.error('[useFriends] fetchRequests error:',
        receivedRes.error?.message ?? sentRes.error?.message ?? tagsRes.error?.message);
      return null;
    }

    return {
      received: (receivedRes.data ?? []) as unknown as FriendWithProfile[],
      sent: (sentRes.data ?? []) as unknown as FriendWithProfile[],
      pendingTags: (tagsRes.data ?? []) as unknown as PendingTag[],
    };
  }, []);

  // Nombre de taguages (mentions) en attente de mon consentement — pour le badge du Cercle.
  const fetchPendingTagsCount = useCallback(async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('point_partners')
      .select('id', { count: 'exact', head: true })
      .eq('partner_id', userId)
      .eq('status', 'pending');
    if (error) {
      console.error('[useFriends] fetchPendingTagsCount error:', error.message);
      return 0;
    }
    return count ?? 0;
  }, []);

  // Annuler une demande d'amitié envoyée (section « Envoyées »).
  const cancelRequest = useCallback(async (friendshipId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);
    if (error) {
      console.error('[useFriends] cancelRequest error:', error.message);
      return false;
    }
    return true;
  }, []);

  // Recherche d'utilisateurs (RPC search_users — exclut date_of_birth/push_token côté serveur).
  const searchUsers = useCallback(async (query: string): Promise<Profile[]> => {
    const { data, error } = await supabase.rpc('search_users', { query });
    if (error) {
      console.error('[useFriends] searchUsers error:', error.message);
      return [];
    }
    return (data ?? []) as Profile[];
  }, []);

  const unfriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('[useFriends] unfriend error:', error.message);
      return false;
    }

    removeFriend(friendshipId);
    return true;
  }, [removeFriend]);

  // Modération (App Store Guideline 1.2) — bloquer un utilisateur.
  // Enregistre le blocage, supprime toute amitié entre les deux (invisibilité mutuelle via RLS),
  // et retire l'utilisateur du cercle local. `supabase as any` : tables hors types générés.
  const blockUser = useCallback(async (myId: string, blockedUserId: string): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('user_blocks')
      .insert({ blocker_id: myId, blocked_id: blockedUserId });
    // 23505 = doublon (déjà bloqué) → considéré comme succès
    if (error && error.code !== '23505') {
      console.error('[useFriends] blockUser error:', error.message);
      return false;
    }
    await supabase
      .from('friendships')
      .delete()
      .or(`and(requester_id.eq.${myId},addressee_id.eq.${blockedUserId}),and(requester_id.eq.${blockedUserId},addressee_id.eq.${myId})`);
    setFriends(friends.filter((f) => f.profile?.id !== blockedUserId));
    return true;
  }, [friends, setFriends]);

  // Modération — liste des comptes bloqués (RPC SECURITY DEFINER : lit le profil hors RLS).
  const fetchBlockedUsers = useCallback(async (): Promise<BlockedUser[]> => {
    const { data, error } = await (supabase as any).rpc('get_blocked_users');
    if (error) {
      console.error('[useFriends] fetchBlockedUsers error:', error.message);
      return [];
    }
    return (data ?? []) as BlockedUser[];
  }, []);

  // Modération — débloquer (supprime la ligne user_blocks ; RLS : delete own).
  const unblockUser = useCallback(async (blockId: string): Promise<boolean> => {
    const { error } = await (supabase as any).from('user_blocks').delete().eq('id', blockId);
    if (error) {
      console.error('[useFriends] unblockUser error:', error.message);
      return false;
    }
    return true;
  }, []);

  // Modération — signaler un utilisateur et/ou un moment (insert seul, lecture admin via service role).
  const reportContent = useCallback(async (params: {
    reporterId: string;
    reportedUserId?: string;
    reportedPointId?: string;
    reason: string;
    details?: string;
  }): Promise<boolean> => {
    const { error } = await (supabase as any)
      .from('content_reports')
      .insert({
        reporter_id: params.reporterId,
        reported_user_id: params.reportedUserId ?? null,
        reported_point_id: params.reportedPointId ?? null,
        reason: params.reason,
        details: params.details ?? null,
      });
    if (error) {
      console.error('[useFriends] reportContent error:', error.message);
      return false;
    }
    return true;
  }, []);

  // Consentement de taguage (D-08) — update mono-table sur point_partners.
  // is_visible bascule server-side via le trigger on_partner_consent — JAMAIS côté client.
  // Mono-table (règle 18) → RLS-safe (mig 010/011 : le partenaire tagué peut maj sa ligne).
  const respondToTag = useCallback(async (
    pointPartnerId: string,
    accept: boolean
  ): Promise<boolean> => {
    const { error } = await supabase
      .from('point_partners')
      // `as never` : contournement local des types Supabase générés (point_partners → never),
      // identique à la dette baseline (respondToRequest l.53, point/[id] handleConsent). Pas de `any`.
      .update({
        status: accept ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString(),
      } as never)
      .eq('id', pointPartnerId);

    if (error) {
      console.error('[useFriends] respondToTag error:', error.message);
      return false;
    }
    return true;
  }, []);

  return {
    friends,
    pendingReceived,
    pendingSent,
    fetchFriends,
    fetchPendingReceived,
    fetchRequests,
    fetchPendingTagsCount,
    sendFriendRequest,
    respondToRequest,
    respondToTag,
    cancelRequest,
    searchUsers,
    unfriend,
    blockUser,
    reportContent,
    fetchBlockedUsers,
    unblockUser,
    setPendingReceived,
    setPendingSent,
  };
}

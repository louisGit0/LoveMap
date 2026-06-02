import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useFriendStore } from '@/stores/friendStore';
import type { FriendWithProfile } from '@/types/app.types';

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
    sendFriendRequest,
    respondToRequest,
    respondToTag,
    unfriend,
    setPendingReceived,
    setPendingSent,
  };
}

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useFriendStore } from '@/stores/friendStore';
import type { FriendWithProfile } from '@/types/app.types';

export function useFriends() {
  const { friends, pendingReceived, pendingSent, setFriends, setPendingReceived, setPendingSent, removeFriend } =
    useFriendStore();

  const fetchFriends = useCallback(async (userId: string) => {
    // Récupère les amitiés acceptées avec le profil de l'autre partie
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
      return;
    }

    const enriched: FriendWithProfile[] = (data ?? []).map((f: any) => ({
      ...f,
      profile: f.requester_id === userId ? f.addressee : f.requester,
    }));

    setFriends(enriched);
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

  return {
    friends,
    pendingReceived,
    pendingSent,
    fetchFriends,
    sendFriendRequest,
    respondToRequest,
    unfriend,
    setPendingReceived,
    setPendingSent,
  };
}

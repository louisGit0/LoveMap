import { create } from 'zustand';
import type { FriendWithProfile, Friendship } from '@/types/app.types';

interface FriendState {
  friends: FriendWithProfile[];
  pendingReceived: FriendWithProfile[];
  pendingSent: Friendship[];

  setFriends: (friends: FriendWithProfile[]) => void;
  setPendingReceived: (requests: FriendWithProfile[]) => void;
  setPendingSent: (requests: Friendship[]) => void;
  removeFriend: (friendshipId: string) => void;
}

export const useFriendStore = create<FriendState>((set) => ({
  friends: [],
  pendingReceived: [],
  pendingSent: [],

  setFriends: (friends) => set({ friends }),
  setPendingReceived: (pendingReceived) => set({ pendingReceived }),
  setPendingSent: (pendingSent) => set({ pendingSent }),

  removeFriend: (friendshipId) =>
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendshipId),
    })),
}));

import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '@/types/app.types';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  ageVerified: boolean;
  dateOfBirth: string | null;

  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setAgeVerified: (verified: boolean, dateOfBirth: string) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  ageVerified: false,
  dateOfBirth: null,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  setAgeVerified: (ageVerified, dateOfBirth) => set({ ageVerified, dateOfBirth }),

  reset: () =>
    set({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      ageVerified: false,
      dateOfBirth: null,
    }),
}));

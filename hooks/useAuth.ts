import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import type { Profile } from '@/types/app.types';

export function useAuth() {
  const { session, user, profile, isLoading, setProfile, reset } = useAuthStore();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[useAuth] fetchProfile error:', error.message);
      return null;
    }

    setProfile(data);
    return data;
  }, [setProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    reset();
  }, [reset]);

  return {
    session,
    user,
    profile,
    isLoading,
    isAuthenticated: !!session,
    fetchProfile,
    signOut,
  };
}

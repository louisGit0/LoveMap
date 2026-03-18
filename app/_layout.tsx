import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#e91e8c',
    secondary: '#9c27b0',
    background: '#0f0f0f',
    surface: '#1a1a1a',
  },
};

export default function RootLayout() {
  const { setSession, setLoading } = useAuthStore();

  useEffect(() => {
    // Récupérer la session existante au démarrage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Écouter les changements d'état d'auth en temps réel
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

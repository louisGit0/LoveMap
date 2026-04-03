import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { fr, registerTranslation } from 'react-native-paper-dates';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { registerForPushNotificationsAsync, savePushToken } from '@/lib/notifications';

registerTranslation('fr', fr);

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
  const { setSession, setLoading, user } = useAuthStore();
  const notifSubRef = useRef<Notifications.Subscription | null>(null);
  const notifResponseRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Push notifications — enregistrement et listeners
  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(user.id, token);
    });

    notifSubRef.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { type?: string; pointId?: string };
      // Snackbar non applicable ici (pas de contexte React Paper) — le badge tab suffit
    });

    notifResponseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; pointId?: string };
      if (data.type === 'partner_tag' && data.pointId) {
        router.push(`/(app)/point/${data.pointId}`);
      }
      if (data.type === 'friend_request') {
        router.push('/(app)/friends/requests');
      }
    });

    return () => {
      notifSubRef.current?.remove();
      notifResponseRef.current?.remove();
    };
  }, [user]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

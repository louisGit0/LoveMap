import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { fr, registerTranslation } from 'react-native-paper-dates';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  InterTight_300Light,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} from '@expo-google-fonts/inter-tight';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { registerForPushNotificationsAsync, savePushToken } from '@/lib/notifications';
import { T } from '@/constants/theme';

registerTranslation('fr', fr);

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: T.primary,
    background: T.bg,
    surface: T.surface,
  },
};

export default function RootLayout() {
  const { setSession, setLoading, user } = useAuthStore();
  const notifSubRef = useRef<Notifications.Subscription | null>(null);
  const notifResponseRef = useRef<Notifications.Subscription | null>(null);

  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light_Italic,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium_Italic,
    InterTight_300Light,
    InterTight_400Regular,
    InterTight_500Medium,
    InterTight_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setSession(session); }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) savePushToken(user.id, token);
    });

    notifSubRef.current = Notifications.addNotificationReceivedListener(() => {});

    notifResponseRef.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; pointId?: string };
      if (data.type === 'partner_tag' && data.pointId) router.push(`/(app)/point/${data.pointId}`);
      if (data.type === 'friend_request') router.push('/(app)/friends/requests');
    });

    return () => {
      notifSubRef.current?.remove();
      notifResponseRef.current?.remove();
    };
  }, [user]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={T.primary} />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

import { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
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
import { useThemeStore } from '@/stores/themeStore';
import { darkTheme, lightTheme } from '@/constants/theme';
import { registerForPushNotificationsAsync, savePushToken } from '@/lib/notifications';

registerTranslation('fr', fr);

export default function RootLayout() {
  const { setSession, setLoading, user } = useAuthStore();
  const isDark = useThemeStore((s) => s.isDark);
  const notifSubRef = useRef<Notifications.Subscription | null>(null);
  const notifResponseRef = useRef<Notifications.Subscription | null>(null);

  const themeColors = isDark ? darkTheme : lightTheme;
  const basePaperTheme = isDark ? MD3DarkTheme : MD3LightTheme;

  const paperTheme = {
    ...basePaperTheme,
    colors: {
      ...basePaperTheme.colors,
      primary: themeColors.primary,
      background: themeColors.bg,
      surface: themeColors.surface,
    },
  };

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
      <View style={{ flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#ff2d87" />
      </View>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

// iOS 26 + react-native-screens 4.16 : `formSheet` (détents custom) est cassé —
// le contenu est ancré en bas / le sheet rend trop petit (RNS #3235, non corrigé
// jusqu'à 4.20+, non corrigeable en JS). On utilise un `modal` plein écran natif
// (carte iOS pageSheet : glisse du bas, swipe-to-dismiss) qui rend correctement.
const sheetOptions = {
  presentation: 'modal' as const,
  gestureEnabled: true,          // swipe-to-dismiss natif (carte modale)
  headerShown: false,            // header éditorial interne
};

export default function AppLayout() {
  const { session, loading } = useAuthStore();
  const T = useTheme();

  useEffect(() => {
    if (!loading && !session) router.replace('/(auth)/login');
  }, [session, loading]);

  if (!session) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: T.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="point/new" options={sheetOptions} />
      <Stack.Screen name="point/[id]" options={sheetOptions} />
    </Stack>
  );
}

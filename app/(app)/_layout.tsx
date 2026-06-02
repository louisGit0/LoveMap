import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

// `presentation` narrowed to its literal so it satisfies the native-stack
// options union; the rest stays inferred (mutable number[] / boolean) to avoid
// the readonly-tuple incompatibility a blanket `as const` introduces (A1 / tsc gate).
const sheetOptions = {
  presentation: 'formSheet' as const,
  sheetAllowedDetents: [0.92],   // D-02 détent unique large (≥0.7 atténue #3235)
  sheetGrabberVisible: true,     // D-03 poignée iOS visible
  sheetCornerRadius: 28,         // D-03 = T.radiusXl
  gestureEnabled: true,          // IOS-01 swipe-to-dismiss natif
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

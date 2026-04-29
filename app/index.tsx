import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, isLoading, ageVerified } = useAuthStore();

  if (isLoading) return null; // Splash screen géré par Expo

  if (session) return <Redirect href="/(app)/map" />;

  if (!ageVerified) return <Redirect href="/(auth)/age-gate" />;

  return <Redirect href="/(auth)/login" />;
}

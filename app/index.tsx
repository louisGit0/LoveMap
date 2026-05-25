import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, isLoading, ageVerified } = useAuthStore();

  if (isLoading) return null; // Splash screen géré par Expo

  // Age gate vérifié EN PREMIER — même si une session est déjà active
  // (session persistée en AsyncStorage ne doit pas court-circuiter la vérification d'âge)
  if (!ageVerified) return <Redirect href="/(auth)/age-gate" />;

  if (!session) return <Redirect href="/(auth)/login" />;

  return <Redirect href="/(app)/map" />;
}

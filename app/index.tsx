import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { session, isLoading, ageVerified } = useAuthStore();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f0f0f', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#e91e8c" size="large" />
      </View>
    );
  }

  if (session) return <Redirect href="/(app)/map" />;

  if (!ageVerified) return <Redirect href="/(auth)/age-gate" />;

  return <Redirect href="/(auth)/login" />;
}

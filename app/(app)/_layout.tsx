import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { T } from '@/constants/theme';

export default function AppLayout() {
  const session = useAuthStore((s) => s.session);
  const pendingReceived = useFriendStore((s) => s.pendingReceived);

  useEffect(() => {
    if (!session) {
      router.replace('/(auth)/login');
    }
  }, [session]);

  if (!session) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: T.surface,
          borderTopColor: T.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textFaint,
      }}
    >
      <Tabs.Screen
        name="map/index"
        options={{
          title: 'Carte',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="point/list"
        options={{
          title: 'Points',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="map-marker-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends/index"
        options={{
          title: 'Cercle',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" color={color} size={size} />
          ),
          tabBarBadge: pendingReceived.length > 0 ? pendingReceived.length : undefined,
          tabBarBadgeStyle: { backgroundColor: T.primary },
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
      {/* Écrans cachés */}
      <Tabs.Screen name="friends/requests" options={{ href: null }} />
      <Tabs.Screen name="point/new" options={{ href: null }} />
      <Tabs.Screen name="point/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
    </Tabs>
  );
}

// TODO Phase 1 — Implémenté par Claude Code
// Bottom tab navigator avec 4 onglets : Map, Friends, Notifications, Profile
import { Tabs } from 'expo-router';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1a1a1a', borderTopColor: '#2a2a2a' },
        tabBarActiveTintColor: '#e91e8c',
        tabBarInactiveTintColor: '#666',
      }}
    >
      <Tabs.Screen name="map/index" options={{ title: 'Carte' }} />
      <Tabs.Screen name="friends/index" options={{ title: 'Amis' }} />
      <Tabs.Screen name="friends/requests" options={{ href: null }} />
      <Tabs.Screen name="point/new" options={{ href: null }} />
      <Tabs.Screen name="point/[id]" options={{ href: null }} />
      <Tabs.Screen name="profile/index" options={{ title: 'Profil' }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
    </Tabs>
  );
}

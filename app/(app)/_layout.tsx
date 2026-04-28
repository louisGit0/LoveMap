import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoPin, IcoList, IcoCircle, IcoUser } from '@/components/icons';

function TabIcon({
  Icon,
  focused,
  badge,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  focused: boolean;
  badge?: boolean;
}) {
  return (
    <View style={{ alignItems: 'center' }}>
      {focused && <View style={styles.activeBar} />}
      <Icon size={20} color={focused ? T.primary : T.textFaint} />
      {badge && <View style={styles.badge} />}
    </View>
  );
}

export default function AppLayout() {
  const { session, loading } = useAuthStore();
  const { pendingReceived } = useFriendStore();

  useEffect(() => {
    if (!loading && !session) router.replace('/(auth)/login');
  }, [session, loading]);

  if (!session) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.textFaint,
      }}
    >
      <Tabs.Screen
        name="map/index"
        options={{
          title: 'Atlas',
          tabBarIcon: ({ focused }) => <TabIcon Icon={IcoPin} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="point/list"
        options={{
          title: 'Carnet',
          tabBarIcon: ({ focused }) => <TabIcon Icon={IcoList} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends/index"
        options={{
          title: 'Cercle',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={IcoCircle} focused={focused} badge={pendingReceived.length > 0} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Moi',
          tabBarIcon: ({ focused }) => <TabIcon Icon={IcoUser} focused={focused} />,
        }}
      />
      {/* Écrans cachés de la tab bar */}
      <Tabs.Screen name="point/new" options={{ href: null }} />
      <Tabs.Screen name="point/[id]" options={{ href: null }} />
      <Tabs.Screen name="friends/requests" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: T.bg + 'f0',
    borderTopWidth: 1,
    borderTopColor: T.border,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  activeBar: {
    position: 'absolute',
    top: -8,
    height: 2,
    width: 28,
    backgroundColor: T.primary,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: -8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.primary,
  },
});

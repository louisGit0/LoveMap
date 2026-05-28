import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs, router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '@/stores/authStore';
import { useFriendStore } from '@/stores/friendStore';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
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
  const T = useTheme();
  const { isDark } = useThemeStore();
  // Couleur inactive bien visible sur fond blurré
  const inactiveColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  return (
    <View style={{ alignItems: 'center' }}>
      {/* Indicateur actif — barre rose en haut */}
      {focused && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            height: 2,
            width: 24,
            backgroundColor: T.primary,
          }}
        />
      )}
      <Icon size={22} color={focused ? T.primary : inactiveColor} />
      {badge && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: -8,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: T.primary,
          }}
        />
      )}
    </View>
  );
}

export default function AppLayout() {
  const { session, loading } = useAuthStore();
  const { pendingReceived } = useFriendStore();
  const T = useTheme();
  const { isDark } = useThemeStore();
  const styles = useMemo(() => makeStyles(T, isDark), [T, isDark]);

  // Couleur label inactive bien lisible
  const inactiveTint = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

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
        tabBarInactiveTintColor: inactiveTint,
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 90 : 85}
            tint={isDark ? 'dark' : 'light'}
            style={[StyleSheet.absoluteFillObject, styles.blurOverlay]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="map/index"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => <TabIcon Icon={IcoPin} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="point/list"
        options={{
          title: 'Moments',
          tabBarIcon: ({ focused }) => <TabIcon Icon={IcoList} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="friends/index"
        options={{
          title: 'Amis',
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
    </Tabs>
  );
}

const makeStyles = (T: Theme, isDark: boolean) => StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
    height: 74,
    paddingBottom: 12,
    paddingTop: 10,
    elevation: 0,
  },
  tabLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 3,
  },
  blurOverlay: {
    // Légère teinte supplémentaire pour garantir le contraste
    backgroundColor: isDark ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.1)',
  },
});

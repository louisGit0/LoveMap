import { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
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
  const inactiveColor = isDark ? '#636366' : '#8e8e93';

  return (
    <View style={{ alignItems: 'center' }}>
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

export default function TabsLayout() {
  const { pendingReceived } = useFriendStore();
  const T = useTheme();
  const { isDark } = useThemeStore();
  const styles = useMemo(() => makeStyles(T, isDark), [T, isDark]);

  const inactiveTint = isDark ? '#636366' : '#8e8e93';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: inactiveTint,
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
      {/* Écran caché de la tab bar */}
      <Tabs.Screen name="friends/requests" options={{ href: null }} />
    </Tabs>
  );
}

const makeStyles = (T: Theme, isDark: boolean) => StyleSheet.create({
  tabBar: {
    // Fond opaque — le BlurView translucide cause des problèmes de lisibilité
    backgroundColor: isDark ? '#111114' : '#f2f2f7',
    borderTopWidth: 0.5,
    borderTopColor: isDark ? '#2c2c2e' : '#c6c6c8',
    height: 83,
    paddingBottom: 28,
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
});

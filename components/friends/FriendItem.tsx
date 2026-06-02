import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/lib/haptics';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { FriendWithProfile } from '@/types/app.types';

interface Props {
  friend: FriendWithProfile;
  onUnfriend: () => void;
  onViewMap?: () => void;
}

export function FriendItem({ friend, onUnfriend, onViewMap }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const { profile } = friend;
  if (!profile) return null;

  const displayName = profile.display_name ?? profile.username;
  const initials = displayName[0]?.toUpperCase() ?? '?';

  function handleUnfriend() {
    haptics.warn();
    Alert.alert(
      'Retirer du cercle ?',
      `${displayName} ne verra plus vos moments partagés. Cette action est irréversible.`,
      [
        { text: 'Garder', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: onUnfriend },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        {profile.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <Text style={styles.avatarInitial}>{initials}</Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.displayName} numberOfLines={1}>
          {displayName}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.username} numberOfLines={1}>
          @{profile.username}
        </Text>
        <View style={styles.actions}>
          {onViewMap && (
            <TouchableOpacity
              onPress={onViewMap}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.mapBtnText}>Carte</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleUnfriend}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.removeBtnText}>Retirer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.primary,
  },
  info: { flex: 1 },
  displayName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 26,
    color: T.text,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  username: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mapBtnText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.primary,
    textDecorationLine: 'underline',
  },
  removeBtnText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.danger,
  },
});

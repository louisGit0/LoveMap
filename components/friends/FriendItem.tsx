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
        <Text style={styles.username} numberOfLines={1}>
          @{profile.username}
        </Text>
      </View>
      <View style={styles.actions}>
        {onViewMap && (
          <TouchableOpacity
            onPress={onViewMap}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={styles.mapBtnText}>Carte</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.actionDivider}>·</Text>
        <TouchableOpacity
          onPress={handleUnfriend}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <Text style={styles.removeBtnText}>Retirer</Text>
        </TouchableOpacity>
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
    width: 46,
    height: 46,
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
    fontSize: 24,
    color: T.primary,
  },
  info: { flex: 1, gap: 3 },
  displayName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 21,
    lineHeight: 25,
    color: T.text,
  },
  username: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionDivider: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textFaint,
    opacity: 0.6,
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

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
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
  const initials = (profile.display_name ?? profile.username)[0]?.toUpperCase() ?? '?';

  function handleUnfriend() {
    Alert.alert(
      'Retirer du cercle',
      `Voulez-vous retirer ${profile.display_name ?? profile.username} de votre cercle ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: onUnfriend },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.displayName}>{profile.display_name ?? profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>
      {onViewMap && (
        <TouchableOpacity style={styles.mapBtn} onPress={onViewMap} activeOpacity={0.7}>
          <Text style={styles.mapBtnText}>Carte</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.removeBtn} onPress={handleUnfriend} activeOpacity={0.7}>
        <Text style={styles.removeBtnText}>Retirer</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
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
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.primary,
  },
  info: { flex: 1 },
  displayName: {
    fontFamily: F.sans,
    fontSize: 14,
    color: T.text,
  },
  username: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    marginTop: 2,
  },
  mapBtn: {
    borderWidth: 1,
    borderColor: T.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapBtnText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.primary,
  },
  removeBtn: {
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeBtnText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
});

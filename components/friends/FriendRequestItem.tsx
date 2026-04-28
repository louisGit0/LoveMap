import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoCheck, IcoClose } from '@/components/icons';
import type { FriendWithProfile } from '@/types/app.types';

interface Props {
  request: FriendWithProfile;
  onAccept: () => void;
  onReject: () => void;
}

export function FriendRequestItem({ request, onAccept, onReject }: Props) {
  const { profile } = request;
  const initials = (profile.display_name ?? profile.username)[0]?.toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.displayName}>{profile.display_name ?? profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={onAccept} activeOpacity={0.88}>
          <IcoCheck size={16} color={T.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={onReject} activeOpacity={0.7}>
          <IcoClose size={14} color={T.textFaint} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtn: {
    width: 36,
    height: 36,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

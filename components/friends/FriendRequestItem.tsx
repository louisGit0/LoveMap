import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.displayName}>{profile.display_name ?? profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptButton} onPress={onAccept} activeOpacity={0.8}>
          <Text style={styles.acceptText}>✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={onReject} activeOpacity={0.8}>
          <Text style={styles.rejectText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9c27b033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#9c27b0',
    fontWeight: 'bold',
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  username: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4caf50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: {
    color: '#f44336',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

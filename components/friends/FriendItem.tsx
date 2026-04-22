import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { FriendWithProfile } from '@/types/app.types';

interface Props {
  friend: FriendWithProfile;
  onUnfriend: () => void;
}

export function FriendItem({ friend, onUnfriend }: Props) {
  const { profile } = friend;
  const initials = (profile.display_name ?? profile.username)[0]?.toUpperCase() ?? '?';

  function handleUnfriend() {
    Alert.alert(
      'Retirer l\'ami',
      `Voulez-vous retirer ${profile.display_name ?? profile.username} de vos amis ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: onUnfriend },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.displayName}>{profile.display_name ?? profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={handleUnfriend} activeOpacity={0.8}>
        <Text style={styles.removeButtonText}>Retirer</Text>
      </TouchableOpacity>
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
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e91e8c',
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
  removeButton: {
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#f44336',
    fontSize: 13,
    fontWeight: '500',
  },
});

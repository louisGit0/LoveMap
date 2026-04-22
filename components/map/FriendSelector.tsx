import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Image,
} from 'react-native';
import { useFriendStore } from '@/stores/friendStore';
import type { FriendWithProfile } from '@/types/app.types';

interface Props {
  onSelectFriend: (friendId: string, friendName: string) => void;
  onSelectSelf: () => void;
  isViewingFriend: boolean;
}

export function FriendSelector({ onSelectFriend, onSelectSelf, isViewingFriend }: Props) {
  const [visible, setVisible] = useState(false);
  const friends = useFriendStore((s) => s.friends);

  function handleSelect(friend: FriendWithProfile) {
    setVisible(false);
    onSelectFriend(friend.profile.id, friend.profile.display_name ?? friend.profile.username);
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, isViewingFriend && styles.triggerActive]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerIcon}>👥</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Voir la carte de...</Text>

          {/* Ma carte */}
          <TouchableOpacity
            style={styles.item}
            onPress={() => { setVisible(false); onSelectSelf(); }}
            activeOpacity={0.7}
          >
            <View style={[styles.avatar, styles.selfAvatar]}>
              <Text style={styles.selfIcon}>🗺</Text>
            </View>
            <Text style={styles.itemName}>Ma carte</Text>
          </TouchableOpacity>

          {friends.length === 0 ? (
            <Text style={styles.emptyText}>Aucun ami pour le moment</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  {item.profile.avatar_url ? (
                    <Image source={{ uri: item.profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(item.profile.display_name ?? item.profile.username)[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={styles.itemName}>{item.profile.display_name}</Text>
                    <Text style={styles.itemUsername}>@{item.profile.username}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a1aee',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  triggerActive: {
    borderWidth: 2,
    borderColor: '#e91e8c',
  },
  triggerIcon: {
    fontSize: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selfAvatar: {
    backgroundColor: '#9c27b033',
  },
  selfIcon: {
    fontSize: 20,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 18,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  itemUsername: {
    color: '#888888',
    fontSize: 12,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
});

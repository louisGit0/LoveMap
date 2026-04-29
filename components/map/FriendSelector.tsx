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
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoCircle } from '@/components/icons';
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
        <IcoCircle size={18} color={isViewingFriend ? T.primary : T.textFaint} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Text style={styles.eyebrow}>Voir la carte de</Text>
          <Text style={styles.title}>le cercle</Text>

          {/* Ma carte */}
          <TouchableOpacity
            style={styles.item}
            onPress={() => { setVisible(false); onSelectSelf(); }}
            activeOpacity={0.75}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>M</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>Ma carte</Text>
              <Text style={styles.itemUsername}>Retour à votre carte</Text>
            </View>
          </TouchableOpacity>

          {friends.length === 0 ? (
            <Text style={styles.emptyText}>Votre cercle est vide.</Text>
          ) : (
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => handleSelect(item)} activeOpacity={0.75}>
                  {item.profile.avatar_url ? (
                    <Image source={{ uri: item.profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatar}>
                      <Text style={styles.avatarInitial}>
                        {(item.profile.display_name ?? item.profile.username)[0].toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.profile.display_name ?? item.profile.username}</Text>
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
    backgroundColor: T.surface + 'f0',
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  triggerActive: {
    borderColor: T.primary,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    padding: 24,
    paddingBottom: 48,
    maxHeight: '60%',
  },
  handle: {
    width: 32,
    height: 2,
    backgroundColor: T.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 4,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 34,
    letterSpacing: -1,
    color: T.text,
    marginBottom: 20,
  },
  item: {
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
  avatarImage: {
    width: 36,
    height: 36,
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.primary,
  },
  itemInfo: { flex: 1 },
  itemName: {
    fontFamily: F.sans,
    fontSize: 14,
    color: T.text,
  },
  itemUsername: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
    paddingTop: 16,
    textAlign: 'center',
  },
});

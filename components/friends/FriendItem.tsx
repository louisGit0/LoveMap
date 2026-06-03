import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, Pressable } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/lib/haptics';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { FriendWithProfile } from '@/types/app.types';

interface Props {
  friend: FriendWithProfile;
  onUnfriend: () => void;
  onViewMap?: () => void;
  /** Signaler cet utilisateur (modération — Guideline 1.2). */
  onReport?: () => void;
  /** Bloquer cet utilisateur (modération — Guideline 1.2). */
  onBlock?: () => void;
}

export function FriendItem({ friend, onUnfriend, onViewMap, onReport, onBlock }: Props) {
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

  // Menu de modération (appui long) — signaler / bloquer (Guideline 1.2).
  function handleModerationMenu() {
    if (!onReport && !onBlock) return;
    haptics.tap();
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (onReport) buttons.push({ text: 'Signaler', onPress: confirmReport });
    if (onBlock) buttons.push({ text: 'Bloquer', style: 'destructive', onPress: confirmBlock });
    buttons.push({ text: 'Annuler', style: 'cancel' });
    Alert.alert(`@${profile?.username}`, 'Que souhaitez-vous faire ?', buttons);
  }

  function confirmReport() {
    Alert.alert(
      'Signaler cet utilisateur ?',
      'Notre équipe examinera ce signalement. Les contenus inappropriés et les utilisateurs abusifs ne sont pas tolérés.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Signaler', style: 'destructive', onPress: () => { haptics.warn(); onReport?.(); } },
      ]
    );
  }

  function confirmBlock() {
    Alert.alert(
      `Bloquer ${displayName} ?`,
      'Vous ne verrez plus ses moments et il ne verra plus les vôtres. Il sera retiré de votre cercle.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Bloquer', style: 'destructive', onPress: () => { haptics.warn(); onBlock?.(); } },
      ]
    );
  }

  return (
    <Pressable
      style={styles.container}
      onLongPress={handleModerationMenu}
      delayLongPress={350}
      accessibilityHint="Appui long pour signaler ou bloquer"
    >
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
    </Pressable>
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

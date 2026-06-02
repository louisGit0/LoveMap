import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import type { FriendWithProfile } from '@/types/app.types';

interface Props {
  request: FriendWithProfile;
  /** Label affirmatif rempli — « Accepter » (amitié) ou « Sceller » (taguage). */
  affirmLabel: string;
  /** Label négatif bordé — « Refuser » (amitié) ou « Décliner » (taguage). */
  negativeLabel: string;
  onAffirm: () => void;
  onNegative: () => void;
}

export function FriendRequestItem({
  request,
  affirmLabel,
  negativeLabel,
  onAffirm,
  onNegative,
}: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const { profile } = request;

  // Profil peut être null si la FK ne résout pas (utilisateur supprimé ou RLS)
  if (!profile) return null;

  const initials = (profile.display_name ?? profile.username)?.[0]?.toUpperCase() ?? '?';

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
          {profile.display_name ?? profile.username}
        </Text>
        <Text style={styles.username}>@{profile.username}</Text>
      </View>
      <View style={styles.actions}>
        <Button variant="coral" fullWidth={false} onPress={onAffirm} style={styles.affirmBtn}>
          <Text style={styles.affirmLabel}>{affirmLabel}</Text>
        </Button>
        <Button variant="ghost" fullWidth={false} onPress={onNegative} style={styles.negativeBtn}>
          <Text style={styles.negativeLabel}>{negativeLabel}</Text>
        </Button>
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
  info: { flex: 1, minWidth: 0 },
  displayName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 26,
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
    alignItems: 'center',
    gap: 8,
  },
  // Boutons texte D-12 : override de la base ui/Button (borderRadius:0) → radiusSm + squircle.
  affirmBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  affirmLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
  },
  negativeBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  negativeLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textDim,
  },
});

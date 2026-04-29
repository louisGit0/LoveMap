import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/lib/supabase';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoCog } from '@/components/icons';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, fetchProfile } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const { friends, fetchFriends } = useFriends();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([fetchMyPoints(user.id), fetchFriends(user.id)]);
      } catch (e: unknown) {
        if (!cancelled) {
          setSnackbar('Erreur de chargement du profil.');
          console.error('[Profile] load error:', e);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const avgNote =
    points.length > 0
      ? (points.reduce((sum, p) => sum + p.note, 0) / points.length).toFixed(1)
      : '—';

  const initials = (profile?.display_name ?? profile?.username ?? '?')[0]?.toUpperCase();

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setSnackbar("Permission galerie refusée."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${user!.id}.${ext}`;
      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) {
        setSnackbar(uploadError.message.includes('bucket') ? "Bucket avatars manquant." : "Erreur : " + uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles')
        .update({ avatar_url: urlData.publicUrl }).eq('id', user!.id);
      if (updateError) { setSnackbar('Erreur mise à jour du profil.'); return; }
      await fetchProfile(user!.id);
      setSnackbar('Portrait mis à jour.');
    } catch (e: unknown) {
      setSnackbar("Erreur : " + (e instanceof Error ? e.message : 'Inconnue'));
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header identité */}
        <View style={styles.header}>
          <View style={styles.innerBorder} pointerEvents="none" />

          <View style={styles.headerTop}>
            {/* Avatar carré */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  onError={() => { /* swallow bad URLs */ }}
                />
              ) : (
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              {/* Indicateur d'édition : carré rose en coin */}
              <View style={styles.avatarCorner}>
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={T.text} />
                ) : null}
              </View>
            </TouchableOpacity>

            <View style={styles.identity}>
              <Text style={styles.displayName}>{profile?.display_name ?? profile?.username}</Text>
              <Text style={styles.username}>@{profile?.username}</Text>
            </View>

            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push('/(app)/profile/settings')}
              activeOpacity={0.7}
            >
              <IcoCog size={18} color={T.textFaint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          {[
            { value: String(points.length), label: 'Entrées' },
            { value: String(friends.length), label: 'Cercle' },
            { value: avgNote, label: 'Moyenne' },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statItem, i > 0 && styles.statItemBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Anthologie */}
        {points.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Anthologie</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/point/list')} activeOpacity={0.7}>
                <Text style={styles.seeAllLink}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {points
              .slice()
              .sort((a, b) => b.note - a.note)
              .slice(0, 5)
              .map((p, i) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.pointRow}
                  onPress={() => router.push(`/(app)/point/${p.id}`)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.pointIndex}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={styles.pointNote}>{p.note}</Text>
                  <Text style={styles.pointComment} numberOfLines={1}>
                    {p.comment ?? 'Sans commentaire'}
                  </Text>
                  <Text style={styles.pointDate}>
                    {new Date(p.created_at).toLocaleDateString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  centered: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 24,
    position: 'relative',
  },
  innerBorder: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 0,
    borderWidth: 1, borderColor: T.border, borderBottomWidth: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBox: {
    width: 72,
    height: 72,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 32,
    color: T.primary,
  },
  avatarCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flex: 1 },
  displayName: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: T.text,
  },
  username: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.textFaint,
    marginTop: 4,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: T.border,
    marginBottom: 0,
  },
  statItem: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
    gap: 4,
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: T.border,
  },
  statValue: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 36,
    lineHeight: 36,
    color: T.primary,
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingBottom: 8,
    marginBottom: 0,
  },
  sectionEyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  seeAllLink: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.primary,
    textDecorationLine: 'underline',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  pointIndex: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.textFaint,
    width: 24,
  },
  pointNote: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 28,
    lineHeight: 28,
    color: T.primary,
    minWidth: 22,
  },
  pointComment: {
    flex: 1,
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.text,
  },
  pointDate: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: T.textFaint,
  },
  snackbar: { backgroundColor: T.surface2 },
});

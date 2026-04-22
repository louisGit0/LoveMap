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
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/lib/supabase';
import { T } from '@/constants/theme';

export default function ProfileScreen() {
  const { user, profile, fetchProfile } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const { friends, fetchFriends } = useFriends();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      await Promise.all([fetchMyPoints(user.id), fetchFriends(user.id)]);
      setLoading(false);
    })();
  }, [user]);

  const avgNote =
    points.length > 0
      ? (points.reduce((sum, p) => sum + p.note, 0) / points.length).toFixed(1)
      : '—';

  const initials = (profile?.display_name ?? profile?.username ?? '?')[0]?.toUpperCase();

  async function handlePickAvatar() {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setSnackbar("Permission d'accès à la galerie refusée.");
      return;
    }
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
      const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, byteArray.buffer, { contentType: `image/${ext}`, upsert: true });
      if (uploadError) {
        setSnackbar(uploadError.message.includes('bucket') ? "Bucket avatars manquant." : "Erreur upload : " + uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user!.id);
      if (updateError) { setSnackbar('Erreur mise à jour du profil.'); return; }
      await fetchProfile(user!.id);
      setSnackbar('Photo de profil mise à jour !');
    } catch (e: unknown) {
      setSnackbar("Erreur : " + (e instanceof Error ? e.message : 'Inconnue'));
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <View style={styles.avatarEditBadge}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.avatarEditIcon}>📷</Text>
              }
            </View>
          </TouchableOpacity>

          <Text style={styles.displayName}>{profile?.display_name ?? profile?.username}</Text>
          <Text style={styles.username}>@{profile?.username}</Text>

          <TouchableOpacity style={styles.settingsButton} onPress={() => router.push('/(app)/profile/settings')}>
            <Text style={styles.settingsButtonText}>Paramètres</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Points', value: String(points.length) },
            { label: 'Moyenne', value: avgNote },
            { label: 'Amis', value: String(friends.length) },
          ].map((s, i) => (
            <View key={s.label} style={[styles.statCard, i > 0 && styles.statCardBorder]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Derniers points */}
        {points.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Meilleurs moments</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/point/list')}>
                <Text style={styles.seeAllLink}>Voir tout ›</Text>
              </TouchableOpacity>
            </View>
            {points.slice(0, 5).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pointRow}
                onPress={() => router.push(`/(app)/point/${p.id}`)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pointNote, { color: noteColor(p.note) }]}>{p.note}</Text>
                <Text style={styles.pointComment} numberOfLines={1}>{p.comment ?? 'Aucun commentaire'}</Text>
                <Text style={styles.pointDate}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</Text>
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

function noteColor(note: number): string {
  if (note <= 3) return T.danger;
  if (note <= 6) return '#fb923c';
  if (note <= 8) return '#a3e635';
  return T.success;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 14,
    position: 'relative',
  },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: T.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.primary,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: T.primary,
  },
  avatarText: {
    color: T.primary,
    fontWeight: '700',
    fontSize: 38,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: T.bg,
  },
  avatarEditIcon: { fontSize: 13 },
  displayName: {
    color: T.text,
    fontSize: 24,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  username: {
    color: T.textDim,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 14,
  },
  settingsButton: {
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.pill,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  settingsButtonText: {
    color: T.textDim,
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: T.surface,
    borderRadius: T.cardRadius,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statCard: {
    flex: 1,
    paddingVertical: 20,
    alignItems: 'center',
  },
  statCardBorder: {
    borderLeftWidth: 1,
    borderLeftColor: T.border,
  },
  statValue: {
    color: T.primary,
    fontSize: 32,
    fontWeight: '300',
    fontStyle: 'italic',
    lineHeight: 36,
  },
  statLabel: {
    color: T.textFaint,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 6,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: T.textFaint,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '500',
  },
  seeAllLink: {
    color: T.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface,
    borderRadius: T.cardRadius,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: T.border,
    gap: 12,
  },
  pointNote: {
    fontWeight: '300',
    fontStyle: 'italic',
    fontSize: 26,
    lineHeight: 28,
    minWidth: 30,
  },
  pointComment: {
    flex: 1,
    color: T.text,
    fontSize: 13,
  },
  pointDate: {
    color: T.textFaint,
    fontSize: 11,
  },
  snackbar: { backgroundColor: T.surface2 },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar, Menu } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

export default function ProfileScreen() {
  const { user, profile, fetchProfile } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const { friends, fetchFriends } = useFriends();
  const setProfile = useAuthStore((s) => s.setProfile);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Menu ActionSheet avatar
  const [avatarMenuVisible, setAvatarMenuVisible] = useState(false);

  // Édition inline du display_name
  const [editingName, setEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);

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

  async function uploadAvatar(uri: string) {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/avatar.jpg`, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        setSnackbar("Erreur lors de l'upload de la photo.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar.jpg`);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) {
        setSnackbar('Erreur lors de la mise à jour du profil.');
        return;
      }

      await fetchProfile(user.id);
      setSnackbar('Photo de profil mise à jour !');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handlePickFromGallery() {
    setAvatarMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setSnackbar("Permission d'accès à la galerie refusée.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return;
    await uploadAvatar(result.assets[0].uri);
  }

  async function handleTakePhoto() {
    setAvatarMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setSnackbar("Permission d'accès à la caméra refusée.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    await uploadAvatar(result.assets[0].uri);
  }

  function startEditName() {
    setEditNameValue(profile?.display_name ?? '');
    setEditingName(true);
  }

  async function handleSaveName() {
    if (!user || !editNameValue.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: editNameValue.trim() })
      .eq('id', user.id);

    if (error) {
      setSnackbar('Erreur lors de la sauvegarde.');
      setSavingName(false);
      return;
    }

    // Mettre à jour le store immédiatement
    if (profile) {
      setProfile({ ...profile, display_name: editNameValue.trim() });
    }
    setEditingName(false);
    setSavingName(false);
    setSnackbar('Nom mis à jour !');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e91e8c" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar avec ActionSheet */}
          <Menu
            visible={avatarMenuVisible}
            onDismiss={() => setAvatarMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={() => setAvatarMenuVisible(true)}
                activeOpacity={0.8}
                disabled={uploadingAvatar}
              >
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  {uploadingAvatar
                    ? <ActivityIndicator size="small" color="#ffffff" />
                    : <Text style={styles.avatarEditIcon}>✎</Text>
                  }
                </View>
              </TouchableOpacity>
            }
            contentStyle={styles.menuContent}
          >
            <Menu.Item
              onPress={handlePickFromGallery}
              title="Choisir dans la galerie"
              leadingIcon="image"
              titleStyle={styles.menuItemText}
            />
            <Menu.Item
              onPress={handleTakePhoto}
              title="Prendre une photo"
              leadingIcon="camera"
              titleStyle={styles.menuItemText}
            />
          </Menu>

          {/* Nom affiché / éditable */}
          {editingName ? (
            <View style={styles.editNameRow}>
              <TextInput
                style={styles.editNameInput}
                value={editNameValue}
                onChangeText={setEditNameValue}
                autoFocus
                maxLength={50}
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <TouchableOpacity
                style={[styles.editNameBtn, styles.editNameSave]}
                onPress={handleSaveName}
                disabled={savingName}
              >
                {savingName
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={styles.editNameBtnText}>✓</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.editNameBtn, styles.editNameCancel]}
                onPress={() => setEditingName(false)}
              >
                <Text style={styles.editNameBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={startEditName} activeOpacity={0.8}>
              <Text style={styles.displayName}>
                {profile?.display_name ?? profile?.username}
              </Text>
              <Text style={styles.editNameIcon}>✎</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.username}>@{profile?.username}</Text>

          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(app)/profile/settings')}
          >
            <Text style={styles.settingsButtonText}>⚙ Paramètres</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{points.length}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgNote}</Text>
            <Text style={styles.statLabel}>Note moy.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{friends.length}</Text>
            <Text style={styles.statLabel}>Amis</Text>
          </View>
        </View>

        {/* Derniers points */}
        {points.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mes derniers points</Text>
            {points.slice(0, 5).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.pointRow}
                onPress={() => router.push(`/(app)/point/${p.id}`)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pointNote, { color: noteColor(p.note) }]}>
                  {p.note}/10
                </Text>
                <Text style={styles.pointComment} numberOfLines={1}>
                  {p.comment ?? 'Aucun commentaire'}
                </Text>
                <Text style={styles.pointDate}>
                  {new Date(p.created_at).toLocaleDateString('fr-FR')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingTop: 56,
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  avatarWrapper: {
    marginBottom: 12,
    position: 'relative',
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e91e8c',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#e91e8c',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 32,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e91e8c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f0f0f',
  },
  avatarEditIcon: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  menuContent: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 14,
  },
  // Édition nom
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  editNameIcon: {
    color: '#888888',
    fontSize: 16,
  },
  editNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  editNameInput: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: '#e91e8c',
    paddingBottom: 4,
    minWidth: 120,
    maxWidth: 200,
  },
  editNameBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editNameSave: {
    backgroundColor: '#4caf50',
  },
  editNameCancel: {
    backgroundColor: '#333',
  },
  editNameBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  username: {
    color: '#888888',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  settingsButton: {
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  settingsButtonText: {
    color: '#888888',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statValue: {
    color: '#e91e8c',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 10,
  },
  pointNote: {
    fontWeight: 'bold',
    fontSize: 14,
    minWidth: 36,
  },
  pointComment: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  pointDate: {
    color: '#555',
    fontSize: 11,
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';

export default function ProfileScreen() {
  const { user, profile, fetchProfile } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const { friends, fetchFriends } = useFriends();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl(profile.avatar_url ?? '');
    }
  }, [profile]);

  const avgNote =
    points.length > 0
      ? (points.reduce((sum, p) => sum + p.note, 0) / points.length).toFixed(1)
      : '—';

  const initials = (profile?.display_name ?? profile?.username ?? '?')[0]?.toUpperCase();

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim(), avatar_url: avatarUrl.trim() || null })
      .eq('id', user.id);

    if (error) {
      setSnackbar('Erreur lors de la sauvegarde.');
    } else {
      await fetchProfile(user.id);
      setEditing(false);
      setSnackbar('Profil mis à jour !');
    }
    setSaving(false);
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
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.displayName}>{profile?.display_name ?? profile?.username}</Text>
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

        {/* Édition du profil */}
        {editing ? (
          <View style={styles.editSection}>
            <Text style={styles.sectionTitle}>Modifier le profil</Text>
            <Input
              label="Nom d'affichage"
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
            />
            <Input
              label="URL de l'avatar (optionnel)"
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              autoCapitalize="none"
              keyboardType="url"
              style={styles.input}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelEdit}
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelEditText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditing(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.editButtonText}>Modifier le profil</Text>
          </TouchableOpacity>
        )}

        {/* Dernier points */}
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

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
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
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e91e8c',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 32,
  },
  displayName: {
    color: '#ffffff',
    fontSize: 22,
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
  editButton: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e91e8c44',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  editButtonText: {
    color: '#e91e8c',
    fontWeight: '600',
    fontSize: 14,
  },
  editSection: {
    marginHorizontal: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelEdit: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelEditText: {
    color: '#888888',
    fontSize: 14,
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#e91e8c',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
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

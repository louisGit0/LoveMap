import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
// Dynamic import to avoid native module crash when module is not in the dev build
let ImagePicker: typeof import('expo-image-picker') | null = null;
try { ImagePicker = require('expo-image-picker'); } catch { ImagePicker = null; }
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoCog, IcoPlus, IcoCheck, IcoClose } from '@/components/icons';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, fetchProfile, signOut } = useAuth();
  const { points, fetchMyPoints } = usePoints();
  const { friends, fetchFriends } = useFriends();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const scrollRef = useRef<ScrollView>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  /* ── Edition inline du prénom ── */
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      await Promise.all([fetchMyPoints(user.id), fetchFriends(user.id)]);
      setLoading(false);
    })();
  }, [user]);

  /* ── Stats ── */
  const avgNote =
    points.length > 0
      ? (points.reduce((sum, p) => sum + p.note, 0) / points.length).toFixed(1)
      : '—';

  const noteDistribution = useMemo(() => {
    const counts = Array.from({ length: 10 }, (_, i) =>
      points.filter((p) => Math.round(p.note) === i + 1).length
    );
    const max = Math.max(...counts, 1);
    return counts.map((count, i) => ({ note: i + 1, count, ratio: count / max }));
  }, [points]);

  const topMonths = useMemo(() => {
    const map: Record<string, { label: string; count: number }> = {};
    for (const p of points) {
      const d = new Date(p.happened_at ?? p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { label: `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`, count: 0 };
      map[key].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 3);
  }, [points]);

  const totalMinutes = useMemo(
    () => points.reduce((sum, p) => sum + (p.duration_minutes ?? 0), 0),
    [points]
  );

  const initials = (profile?.display_name ?? profile?.username ?? '?')[0]?.toUpperCase();

  /* ── Upload avatar ── */
  async function handlePickAvatar() {
    if (!ImagePicker) { setSnackbar("Galerie non disponible dans ce build."); return; }
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
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType?.Base64 ?? 'base64',
      });
      const byteCharacters = atob(base64);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, byteArray.buffer, { contentType: `image/${ext}`, upsert: true });
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

  /* ── Sauvegarde du prénom ── */
  function startEditingName() {
    setEditName(profile?.display_name ?? '');
    setIsEditingName(true);
    // Scroll to top pour voir le champ
    setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
  }

  async function saveDisplayName() {
    const trimmed = editName.trim();
    if (!trimmed) { setSnackbar('Le prénom ne peut pas être vide.'); return; }
    if (trimmed === profile?.display_name) { setIsEditingName(false); return; }
    setSavingName(true);
    const { error } = await supabase.from('profiles').update({ display_name: trimmed }).eq('id', user!.id);
    setSavingName(false);
    if (error) { setSnackbar('Erreur de mise à jour.'); return; }
    await fetchProfile(user!.id);
    setIsEditingName(false);
    setSnackbar('Prénom mis à jour.');
  }

  function cancelEditName() {
    setIsEditingName(false);
    setEditName('');
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}>

        {/* ── Header identité ── */}
        <View style={styles.header}>
          <View style={styles.innerBorder} pointerEvents="none" />

          <View style={styles.headerTop}>
            {/* Avatar 80×80 + badge + */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
              disabled={uploadingAvatar}
            >
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.plusBadge}>
                {uploadingAvatar
                  ? <ActivityIndicator size="small" color={T.text} />
                  : <IcoPlus size={10} color={T.text} />
                }
              </View>
            </TouchableOpacity>

            {/* Identité + édition inline */}
            <View style={styles.identity}>
              {isEditingName ? (
                <View style={styles.editNameBlock}>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.editNameInput, { color: T.text }]}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={saveDisplayName}
                    selectionColor={T.primary}
                    placeholderTextColor={T.textFaint}
                  />
                  <View style={styles.editNameActions}>
                    {savingName ? (
                      <ActivityIndicator size="small" color={T.primary} />
                    ) : (
                      <>
                        <TouchableOpacity onPress={saveDisplayName} style={styles.editIconBtn} activeOpacity={0.75}>
                          <IcoCheck size={14} color={T.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={cancelEditName} style={styles.editIconBtn} activeOpacity={0.75}>
                          <IcoClose size={14} color={T.textFaint} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.displayName}>{profile?.display_name ?? profile?.username}</Text>
              )}
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

        {/* ── Statistiques ── */}
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

        {/* ── Anthologie ── */}
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

        {/* ── Analyse ── */}
        {points.length > 0 && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Analyse</Text>
            </View>

            <View style={styles.analyseBlock}>
              <Text style={styles.analyseTitle}>Distribution des notes</Text>
              {noteDistribution.map(({ note, count, ratio }) => (
                <View key={note} style={styles.noteBarRow}>
                  <Text style={styles.noteBarLabel}>{note}</Text>
                  <View style={styles.noteBarTrack}>
                    <View style={[styles.noteBarFill, { flex: ratio }]} />
                    <View style={{ flex: 1 - ratio }} />
                  </View>
                  <Text style={styles.noteBarCount}>{count}</Text>
                </View>
              ))}
            </View>

            {topMonths.length > 0 && (
              <View style={styles.analyseBlock}>
                <Text style={styles.analyseTitle}>Mois les plus actifs</Text>
                {topMonths.map((m, i) => (
                  <View key={m.label} style={styles.topMonthRow}>
                    <Text style={styles.topMonthRank}>{String(i + 1).padStart(2, '0')}</Text>
                    <Text style={styles.topMonthLabel}>{m.label}</Text>
                    <Text style={styles.topMonthCount}>{m.count}</Text>
                  </View>
                ))}
              </View>
            )}

            {totalMinutes > 0 && (
              <View style={styles.analyseBlock}>
                <Text style={styles.analyseTitle}>Durée totale</Text>
                <Text style={styles.analyseDuration}>
                  {Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, '0')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Actions ── */}
        <View style={[styles.section, { paddingTop: 0, paddingBottom: 48 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Actions</Text>
          </View>

          <TouchableOpacity style={styles.actionRow} onPress={startEditingName} activeOpacity={0.75}>
            <Text style={styles.actionLabel}>Modifier le prénom</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(app)/profile/settings')} activeOpacity={0.75}>
            <Text style={styles.actionLabel}>Paramètres</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={signOut} activeOpacity={0.75}>
            <Text style={[styles.actionLabel, { color: T.primary }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  centered: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' },

  /* Header */
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

  /* Avatar 80×80 */
  avatarWrapper: {
    position: 'relative',
  },
  avatarBox: {
    width: 80,
    height: 80,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  avatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 36,
    color: T.primary,
  },
  /* Badge + dans le coin bas-droit */
  plusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Identité */
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

  /* Edition inline du prénom */
  editNameBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: T.primary,
    paddingBottom: 4,
    gap: 8,
  },
  editNameInput: {
    flex: 1,
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    padding: 0,
    margin: 0,
  },
  editNameActions: {
    flexDirection: 'row',
    gap: 4,
  },
  editIconBtn: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Settings button */
  settingsBtn: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Stats */
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

  /* Sections génériques */
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

  /* Anthologie */
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

  /* Analyse */
  analyseBlock: {
    paddingTop: 20,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  analyseTitle: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 12,
  },
  noteBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  noteBarLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: T.textFaint,
    width: 16,
    textAlign: 'right',
  },
  noteBarTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 3,
    backgroundColor: T.surface2,
  },
  noteBarFill: {
    height: 3,
    backgroundColor: T.primary,
  },
  noteBarCount: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: T.textFaint,
    width: 20,
    textAlign: 'right',
  },
  topMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  topMonthRank: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.textFaint,
    width: 20,
  },
  topMonthLabel: {
    flex: 1,
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.text,
  },
  topMonthCount: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 1,
    color: T.primary,
  },
  analyseDuration: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 48,
    lineHeight: 48,
    letterSpacing: -1,
    color: T.primary,
    marginTop: 4,
  },

  /* Actions */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  actionLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.text,
  },
  actionArrow: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.textFaint,
  },

  snackbar: { backgroundColor: T.surface2 },
});

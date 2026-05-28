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
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriends } from '@/hooks/useFriends';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/Input';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoPlus, IcoCheck, IcoClose, IcoSun, IcoMoon } from '@/components/icons';

let ImagePicker: typeof import('expo-image-picker') | null = null;
try { ImagePicker = require('expo-image-picker'); } catch { ImagePicker = null; }

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
  const { isDark, toggleTheme } = useThemeStore();
  const reset = useAuthStore((s) => s.reset);
  const scrollRef = useRef<ScrollView>(null);

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  /* ── Edition inline du prénom ── */
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingName, setSavingName] = useState(false);

  /* ── Email ── */
  const [showEmail, setShowEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  /* ── Mot de passe ── */
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  /* ── Suppression ── */
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (!user) return;
    if (!profile) fetchProfile(user.id);
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
    if (!ImagePicker) {
      Alert.alert(
        'Galerie indisponible',
        'Cette fonctionnalité nécessite une mise à jour de l\'application.',
        [{ text: 'OK' }],
      );
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Accès galerie refusé',
        'Pour choisir un portrait, autorisez l\'accès à la galerie dans les réglages.',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
        ],
      );
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
        setSnackbar(uploadError.message.includes('bucket') ? 'Bucket avatars manquant.' : 'Erreur : ' + uploadError.message);
        return;
      }
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('id', user!.id);
      await fetchProfile(user!.id);
      setSnackbar('Portrait mis à jour.');
    } catch (e: unknown) {
      setSnackbar('Erreur : ' + (e instanceof Error ? e.message : 'Inconnue'));
    } finally {
      setUploadingAvatar(false);
    }
  }

  /* ── Prénom ── */
  function startEditingName() {
    setEditName(profile?.display_name ?? '');
    setIsEditingName(true);
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

  /* ── Email ── */
  async function handleChangeEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setSnackbar('Adresse email invalide.'); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setSavingEmail(false);
    if (error) { setSnackbar('Erreur : ' + error.message); return; }
    setSnackbar('Email mis à jour. Vérifiez votre boîte mail.');
    setNewEmail('');
    setShowEmail(false);
  }

  /* ── Mot de passe ── */
  async function handleChangePassword() {
    if (newPassword.length < 8) { setSnackbar('8 caractères minimum.'); return; }
    if (newPassword !== confirmPassword) { setSnackbar('Les mots de passe ne correspondent pas.'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) { setSnackbar('Erreur : ' + error.message); return; }
    setSnackbar('Mot de passe mis à jour.');
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  }

  /* ── Déconnexion ── */
  function handleSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  }

  /* ── Suppression ── */
  async function handleDeleteAccount() {
    if (deleteConfirm !== 'EFFACER') { setSnackbar('Tapez exactement "EFFACER" pour confirmer.'); return; }
    if (!user) return;
    Alert.alert(
      'Effacer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer définitivement',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account', { body: { userId: user.id } });
            if (error) { setSnackbar('Erreur lors de la suppression.'); return; }
            reset();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
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
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Header identité ── */}
        <View style={styles.header}>
          <View style={styles.innerBorder} pointerEvents="none" />
          <View style={styles.headerTop}>
            {/* Avatar 80×80 + badge + */}
            <TouchableOpacity style={styles.avatarWrapper} onPress={handlePickAvatar} activeOpacity={0.8} disabled={uploadingAvatar}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarInitial}>{initials}</Text>
                </View>
              )}
              <View style={styles.plusBadge}>
                {uploadingAvatar ? <ActivityIndicator size="small" color={T.text} /> : <IcoPlus size={10} color={T.text} />}
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
                        <TouchableOpacity onPress={() => setIsEditingName(false)} style={styles.editIconBtn} activeOpacity={0.75}>
                          <IcoClose size={14} color={T.textFaint} />
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.displayName}>{profile?.display_name ?? profile?.username ?? '—'}</Text>
              )}
              <Text style={styles.username}>@{profile?.username ?? '...'}</Text>
            </View>

            {/* Toggle thème */}
            <TouchableOpacity style={styles.themeBtn} onPress={toggleTheme} activeOpacity={0.7}>
              {isDark ? <IcoSun size={18} color={T.textFaint} /> : <IcoMoon size={18} color={T.textFaint} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Statistiques ── */}
        <View style={styles.statsRow}>
          {[
            { value: String(points.length), label: 'Entrées' },
            { value: String(friends.length), label: 'Amis' },
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
            {points.slice().sort((a, b) => b.note - a.note).slice(0, 5).map((p, i) => (
              <TouchableOpacity key={p.id} style={styles.pointRow} onPress={() => router.push(`/(app)/point/${p.id}`)} activeOpacity={0.75}>
                <Text style={styles.pointIndex}>{String(i + 1).padStart(2, '0')}</Text>
                <Text style={styles.pointNote}>{p.note}</Text>
                <Text style={styles.pointComment} numberOfLines={1}>{p.comment ?? 'Sans commentaire'}</Text>
                <Text style={styles.pointDate}>{new Date(p.created_at).toLocaleDateString('fr-FR')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Analyse ── */}
        {points.length > 0 && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>Analyse</Text></View>
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
                <Text style={styles.analyseDuration}>{Math.floor(totalMinutes / 60)}h{String(totalMinutes % 60).padStart(2, '0')}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Compte ── */}
        <View style={[styles.section, { paddingTop: 0 }]}>
          <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>Mon compte</Text></View>

          {/* Modifier le prénom */}
          <TouchableOpacity style={styles.actionRow} onPress={startEditingName} activeOpacity={0.75}>
            <Text style={styles.actionLabel}>Modifier le prénom</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {/* Mode sombre */}
          <View style={styles.switchRow}>
            <Text style={styles.actionLabel}>Mode sombre</Text>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#e2e2e2', true: T.primary }} thumbColor={T.text} />
          </View>

          {/* Email — collapsible */}
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowEmail(!showEmail)} activeOpacity={0.75}>
            <Text style={styles.actionLabel}>Changer l'email</Text>
            <Text style={styles.actionArrow}>{showEmail ? '↑' : '→'}</Text>
          </TouchableOpacity>
          {showEmail && (
            <View style={styles.subForm}>
              <Text style={styles.currentEmail}>{user?.email}</Text>
              <Input label="Nouvel email" value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" containerStyle={styles.inputWrap} />
              <TouchableOpacity style={[styles.updateBtn, savingEmail && { opacity: 0.6 }]} onPress={handleChangeEmail} disabled={savingEmail} activeOpacity={0.88}>
                <Text style={styles.updateBtnText}>{savingEmail ? 'Mise à jour...' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Mot de passe — collapsible */}
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPassword(!showPassword)} activeOpacity={0.75}>
            <Text style={styles.actionLabel}>Changer le mot de passe</Text>
            <Text style={styles.actionArrow}>{showPassword ? '↑' : '→'}</Text>
          </TouchableOpacity>
          {showPassword && (
            <View style={styles.subForm}>
              <Input
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPwd}
                containerStyle={styles.inputWrap}
                right={
                  <TouchableOpacity onPress={() => setShowNewPwd(!showNewPwd)} style={styles.showToggle}>
                    <Text style={styles.showToggleText}>{showNewPwd ? 'masquer' : 'voir'}</Text>
                  </TouchableOpacity>
                }
              />
              <Input
                label="Confirmer"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPwd}
                containerStyle={styles.inputWrap}
                right={
                  <TouchableOpacity onPress={() => setShowConfirmPwd(!showConfirmPwd)} style={styles.showToggle}>
                    <Text style={styles.showToggleText}>{showConfirmPwd ? 'masquer' : 'voir'}</Text>
                  </TouchableOpacity>
                }
              />
              <TouchableOpacity style={[styles.updateBtn, savingPwd && { opacity: 0.6 }]} onPress={handleChangePassword} disabled={savingPwd} activeOpacity={0.88}>
                <Text style={styles.updateBtnText}>{savingPwd ? 'Mise à jour...' : 'Confirmer'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Déconnexion */}
          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleSignOut} activeOpacity={0.75}>
            <Text style={[styles.actionLabel, { color: T.primary }]}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>

        {/* ── Zone irréversible ── */}
        <View style={[styles.dangerBlock, { paddingBottom: 60 }]}>
          <Text style={styles.dangerEyebrow}>Zone irréversible</Text>
          <Text style={styles.dangerDescription}>
            Pour effacer définitivement votre compte et toutes vos pages,
            inscrivez{' '}<Text style={styles.dangerKeyword}>EFFACER</Text>{' '}ci-dessous.
          </Text>
          <Input label="Confirmation" value={deleteConfirm} onChangeText={setDeleteConfirm} autoCapitalize="characters" containerStyle={styles.inputWrap} />
          <TouchableOpacity style={[styles.deleteBtn, deleteConfirm !== 'EFFACER' && styles.deleteBtnDisabled]} onPress={handleDeleteAccount} activeOpacity={0.8}>
            <Text style={styles.deleteBtnText}>Effacer mon compte</Text>
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

  header: { paddingTop: 24, paddingBottom: 24, paddingHorizontal: 24, position: 'relative' },
  innerBorder: { position: 'absolute', top: 16, left: 16, right: 16, bottom: 0, borderWidth: 1, borderColor: T.border, borderBottomWidth: 0 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  avatarWrapper: { position: 'relative' },
  avatarBox: { width: 80, height: 80, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80 },
  avatarInitial: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 36, color: T.primary },
  plusBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },

  identity: { flex: 1 },
  displayName: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 28, lineHeight: 30, letterSpacing: -0.5, color: T.text },
  username: { fontFamily: F.mono, fontSize: 10, letterSpacing: 1.5, color: T.textFaint, marginTop: 4 },

  editNameBlock: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.primary, paddingBottom: 4, gap: 8 },
  editNameInput: { flex: 1, fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 24, lineHeight: 28, letterSpacing: -0.5, padding: 0, margin: 0 },
  editNameActions: { flexDirection: 'row', gap: 4 },
  editIconBtn: { width: 28, height: 28, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },

  themeBtn: { width: 40, height: 40, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: T.border },
  statItem: { flex: 1, paddingVertical: 20, alignItems: 'center', gap: 4 },
  statItemBorder: { borderLeftWidth: 1, borderLeftColor: T.border },
  statValue: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 36, lineHeight: 36, color: T.primary, letterSpacing: -1 },
  statLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: T.textFaint },

  section: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 8, marginBottom: 0 },
  sectionEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: T.textFaint },
  seeAllLink: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 14, color: T.primary, textDecorationLine: 'underline' },

  pointRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border, gap: 12 },
  pointIndex: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, color: T.textFaint, width: 24 },
  pointNote: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 28, lineHeight: 28, color: T.primary, minWidth: 22 },
  pointComment: { flex: 1, fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, color: T.text },
  pointDate: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: T.textFaint },

  analyseBlock: { paddingTop: 20, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: T.border },
  analyseTitle: { fontFamily: F.mono, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: T.textFaint, marginBottom: 12 },
  noteBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  noteBarLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: T.textFaint, width: 16, textAlign: 'right' },
  noteBarTrack: { flex: 1, flexDirection: 'row', height: 3, backgroundColor: T.surface2 },
  noteBarFill: { height: 3, backgroundColor: T.primary },
  noteBarCount: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: T.textFaint, width: 20, textAlign: 'right' },
  topMonthRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.border, gap: 12 },
  topMonthRank: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, color: T.textFaint, width: 20 },
  topMonthLabel: { flex: 1, fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: T.text },
  topMonthCount: { fontFamily: F.mono, fontSize: 11, letterSpacing: 1, color: T.primary },
  analyseDuration: { fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 48, lineHeight: 48, letterSpacing: -1, color: T.primary, marginTop: 4 },

  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.border },
  actionLabel: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: T.text },
  actionArrow: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: T.textFaint },

  subForm: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border, gap: 0 },
  currentEmail: { fontFamily: F.mono, fontSize: 11, letterSpacing: 0.5, color: T.textFaint, marginBottom: 16 },
  inputWrap: { marginBottom: 16 },
  showToggle: { paddingBottom: 4 },
  showToggleText: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: T.textFaint },
  updateBtn: { backgroundColor: T.primary, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  updateBtnText: { fontFamily: F.sansMedium, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: T.text },

  dangerBlock: { paddingHorizontal: 24, paddingTop: 32, borderTopWidth: 1, borderTopColor: T.primary + '33', marginTop: 24 },
  dangerEyebrow: { fontFamily: F.mono, fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: T.primary, marginBottom: 12 },
  dangerDescription: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 15, lineHeight: 22, color: T.textDim, marginBottom: 20 },
  dangerKeyword: { fontFamily: F.mono, fontSize: 13, color: T.primary, fontStyle: 'normal' },
  deleteBtn: { borderWidth: 1, borderColor: T.primary, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  deleteBtnDisabled: { opacity: 0.3 },
  deleteBtnText: { fontFamily: F.sansMedium, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: T.primary },

  snackbar: { backgroundColor: T.surface2 },
});

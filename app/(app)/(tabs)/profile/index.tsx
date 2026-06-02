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
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useTheme } from '@/hooks/useTheme';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/lib/haptics';
import { Input } from '@/components/ui/Input';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoPlus, IcoCheck, IcoClose, IcoSun, IcoMoon } from '@/components/icons';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, fetchProfile, signOut } = useAuth();
  const { points, fetchMyPoints } = usePoints();
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
      await fetchMyPoints(user.id);
      setLoading(false);
    })();
  }, [user]);

  /* ── Analyse (sources bento — useMemos préservés) ── */
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

  const hasMoments = points.length > 0;
  const durationLabel = `${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, '0')}`;
  const initials = (profile?.display_name ?? profile?.username ?? '?')[0]?.toUpperCase();

  /* ── Upload avatar ── */
  async function handlePickAvatar() {
    // Dynamic require obligatoire — import statique crashe le module natif iOS au chargement de l'écran
    let ImagePicker: typeof import('expo-image-picker');
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ImagePicker = require('expo-image-picker');
    } catch (e) {
      setSnackbar('Galerie indisponible : ' + (e instanceof Error ? e.message : String(e)));
      return;
    }
    // iOS 14+ : PHPickerViewController gère sa propre permission — pas besoin de requestMediaLibraryPermissionsAsync()
    let result: import('expo-image-picker').ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } catch (e) {
      // Surface l'erreur réelle au lieu de la masquer (a caché le mismatch de version expo-image-picker).
      setSnackbar('Galerie : ' + (e instanceof Error ? e.message : String(e)));
      return;
    }
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingAvatar(true);
    try {
      const asset = result.assets[0];
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${user!.id}.${ext}`;
      // SDK 54 : readAsStringAsync / EncodingType ont migré vers l'API legacy.
      // L'import principal ne les expose plus (readAsStringAsync = undefined a l'exécution).
      let FileSystem: typeof import('expo-file-system/legacy') | null = null;
      try { FileSystem = require('expo-file-system/legacy'); } catch { FileSystem = null; }
      if (!FileSystem) {
        setSnackbar('Impossible de lire le fichier image.');
        return;
      }
      const base64 = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: (FileSystem.EncodingType?.Base64 ?? 'base64') as 'base64',
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
            if (error) { haptics.error(); setSnackbar('Erreur lors de la suppression.'); return; }
            haptics.warn();
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

        {/* ── En-tête couverture (D-03) ── */}
        <View style={styles.cover}>
          <AppText variant="eyebrow" style={styles.coverEyebrow}>MOI</AppText>

          {/* Avatar carré 80px — borderRadius:0 (exception D-12) */}
          <PressableScale style={styles.avatarWrapper} onPress={() => { haptics.tap(); handlePickAvatar(); }} disabled={uploadingAvatar}>
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
          </PressableScale>

          {/* Nom (Cover 56) + édition inline + @username */}
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
                maxFontSizeMultiplier={1.15}
              />
              <View style={styles.editNameActions}>
                {savingName ? (
                  <ActivityIndicator size="small" color={T.primary} />
                ) : (
                  <>
                    <TouchableOpacity onPress={saveDisplayName} style={styles.editIconBtn} activeOpacity={0.75} accessibilityLabel="Enregistrer le prénom">
                      <IcoCheck size={14} color={T.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setIsEditingName(false)} style={styles.editIconBtn} activeOpacity={0.75} accessibilityLabel="Annuler">
                      <IcoClose size={14} color={T.textFaint} />
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={startEditingName} activeOpacity={0.75} accessibilityLabel="Modifier le prénom">
              <AppText variant="display" style={styles.coverName}>
                {profile?.display_name ?? profile?.username ?? '—'}
              </AppText>
            </TouchableOpacity>
          )}
          <AppText variant="eyebrow" style={styles.username}>@{profile?.username ?? '...'}</AppText>
        </View>

        {/* ── Analyse — mini-bento (D-04) ── */}
        <View style={styles.bentoSection}>
          <AppText variant="eyebrow" style={styles.bentoEyebrow}>ANALYSE</AppText>

          {/* Tuile A — Pages du carnet (la plus grande, pleine largeur) */}
          <View style={styles.tileFull}>
            <AppText variant="display" style={styles.tileNumber}>{String(points.length)}</AppText>
            <AppText variant="eyebrow" style={styles.tileLabel}>PAGES DU CARNET</AppText>
            {!hasMoments && (
              <AppText variant="eyebrow" style={styles.tileHelp}>Le carnet est encore vierge.</AppText>
            )}
          </View>

          {hasMoments && (
            <>
              {/* Row 2 — Durée totale (B) + Mois les plus actifs (C) */}
              <View style={styles.bentoRow}>
                <View style={[styles.tileHalf, styles.tileRowItem]}>
                  <AppText variant="display" style={styles.tileDuration}>{durationLabel}</AppText>
                  <AppText variant="eyebrow" style={styles.tileLabel}>DURÉE TOTALE</AppText>
                </View>
                <View style={[styles.tileHalf, styles.tileRowItemLast]}>
                  <AppText variant="eyebrow" style={styles.tileLabel}>MOIS LES PLUS ACTIFS</AppText>
                  {topMonths.length > 0 ? (
                    topMonths.map((m) => (
                      <View key={m.label} style={styles.tileMonthRow}>
                        <AppText variant="title" style={styles.tileMonthLabel} numberOfLines={1}>{m.label}</AppText>
                        <AppText variant="eyebrow" style={styles.tileMonthCount}>{m.count}</AppText>
                      </View>
                    ))
                  ) : (
                    <AppText variant="eyebrow" style={styles.tileHelp}>—</AppText>
                  )}
                </View>
              </View>

              {/* Tuile D — Distribution des notes (pleine largeur) */}
              <View style={styles.tileFullSlim}>
                <AppText variant="eyebrow" style={styles.tileLabel}>DISTRIBUTION DES NOTES</AppText>
                <View style={styles.distribution}>
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
              </View>
            </>
          )}
        </View>

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

  /* ── Cover ── */
  cover: { paddingTop: 24, paddingBottom: 32, paddingHorizontal: 16 },
  coverEyebrow: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: T.textFaint, marginBottom: 24 },

  avatarWrapper: { position: 'relative', width: 80, height: 80 },
  avatarBox: { width: 80, height: 80, backgroundColor: T.surface2, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80 },
  avatarInitial: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 36, color: T.primary },
  plusBadge: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },

  coverName: { fontSize: 56, lineHeight: 60, fontStyle: 'italic', letterSpacing: -1, color: T.text, marginTop: 24 },
  username: { fontSize: 10, letterSpacing: 1.5, color: T.textFaint, marginTop: 8 },

  editNameBlock: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.primary, paddingBottom: 4, gap: 8, marginTop: 24 },
  editNameInput: { flex: 1, fontFamily: F.serifLight, fontStyle: 'italic', fontSize: 40, lineHeight: 46, letterSpacing: -1, padding: 0, margin: 0 },
  editNameActions: { flexDirection: 'row', gap: 4 },
  editIconBtn: { width: 44, height: 44, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center', borderRadius: T.radiusSm, borderCurve: 'continuous' },

  /* ── Bento Analyse ── */
  bentoSection: { paddingHorizontal: 16, paddingBottom: 24 },
  bentoEyebrow: { fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: T.textFaint, marginBottom: 16 },

  tileFull: { backgroundColor: T.surface, borderRadius: T.cardRadius, borderCurve: 'continuous', padding: 16, minHeight: 140, justifyContent: 'center', marginBottom: 24 },
  tileFullSlim: { backgroundColor: T.surface, borderRadius: T.cardRadius, borderCurve: 'continuous', padding: 16 },
  tileHalf: { backgroundColor: T.surface, borderRadius: T.cardRadius, borderCurve: 'continuous', padding: 16, minHeight: 110, flex: 1 },
  bentoRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  tileRowItem: { justifyContent: 'center' },
  tileRowItemLast: {},

  tileNumber: { fontSize: 56, lineHeight: 60, fontStyle: 'italic', letterSpacing: -1, color: T.text, marginBottom: 4 },
  tileDuration: { fontSize: 32, lineHeight: 36, fontStyle: 'italic', letterSpacing: -0.5, color: T.text, marginBottom: 4 },
  tileLabel: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: T.textFaint },
  tileHelp: { fontSize: 10, letterSpacing: 1, color: T.textFaint, marginTop: 8 },

  tileMonthRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  tileMonthLabel: { flex: 1, fontSize: 18, fontStyle: 'italic', color: T.textDim },
  tileMonthCount: { fontSize: 11, letterSpacing: 1, color: T.primary },

  distribution: { marginTop: 16 },
  noteBarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  noteBarLabel: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: T.textFaint, width: 16, textAlign: 'right' },
  noteBarTrack: { flex: 1, flexDirection: 'row', height: 3, backgroundColor: T.surface2 },
  noteBarFill: { height: 3, backgroundColor: T.primary },
  noteBarCount: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1, color: T.textFaint, width: 20, textAlign: 'right' },

  /* ── Compte ── */
  section: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 8, marginBottom: 0 },
  sectionEyebrow: { fontFamily: F.mono, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: T.textFaint },

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

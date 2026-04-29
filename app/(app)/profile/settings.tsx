import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useTheme } from '@/hooks/useTheme';
import { Input } from '@/components/ui/Input';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoArrow } from '@/components/icons';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const reset = useAuthStore((s) => s.reset);
  const { isDark, toggleTheme } = useThemeStore();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  async function handleChangePassword() {
    if (newPassword.length < 8) { setSnackbar('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (newPassword !== confirmPassword) { setSnackbar('Les mots de passe ne correspondent pas.'); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setSnackbar('Erreur : ' + error.message);
    } else {
      setSnackbar('Mot de passe mis à jour.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPwd(false);
  }

  async function handleChangeEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setSnackbar('Adresse email invalide.'); return; }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      setSnackbar('Erreur : ' + error.message);
    } else {
      setSnackbar('Email mis à jour. Vérifiez votre boîte mail pour confirmer.');
      setNewEmail('');
    }
    setSavingEmail(false);
  }

  async function handleSignOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'EFFACER') {
      setSnackbar('Tapez exactement "EFFACER" pour confirmer.');
      return;
    }
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
            const { error } = await supabase.functions.invoke('delete-account', {
              body: { userId: user.id },
            });
            if (error) { setSnackbar('Erreur lors de la suppression.'); return; }
            reset();
            router.replace('/(auth)/age-gate');
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 60 }}
      >
        {/* Retour */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <IcoArrow size={16} color={T.primary} dir="left" />
          <Text style={styles.backText}>Identité</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Réglages</Text>

        {/* Section — Apparence */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>Apparence</Text>
          <View style={styles.themeRow}>
            <Text style={styles.themeLabel}>Mode sombre</Text>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#e2e2e2', true: T.primary }}
              thumbColor={T.text}
            />
          </View>
        </View>

        {/* Section — Email */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>Email</Text>
          <Text style={styles.currentEmail}>{user?.email}</Text>
          <Input
            label="Nouvel email"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.inputWrap}
          />
          <TouchableOpacity
            style={[styles.updateBtn, savingEmail && { opacity: 0.6 }]}
            onPress={handleChangeEmail}
            disabled={savingEmail}
            activeOpacity={0.88}
          >
            <Text style={styles.updateBtnText}>
              {savingEmail ? 'Mise à jour...' : 'Changer l\'email'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section — Identité (mot de passe) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionEyebrow}>Identité</Text>

          <Input
            label="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            containerStyle={styles.inputWrap}
            right={
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.showToggle}>
                <Text style={styles.showToggleText}>{showNew ? 'masquer' : 'voir'}</Text>
              </TouchableOpacity>
            }
          />

          <Input
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            containerStyle={styles.inputWrap}
            right={
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.showToggle}>
                <Text style={styles.showToggleText}>{showConfirm ? 'masquer' : 'voir'}</Text>
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            style={[styles.updateBtn, savingPwd && { opacity: 0.6 }]}
            onPress={handleChangePassword}
            disabled={savingPwd}
            activeOpacity={0.88}
          >
            <Text style={styles.updateBtnText}>
              {savingPwd ? 'Mise à jour...' : 'Mettre à jour'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
          <Text style={styles.signOutLabel}>Se déconnecter</Text>
          <Text style={styles.signOutArrow}>›</Text>
        </TouchableOpacity>

        {/* Zone irréversible */}
        <View style={styles.dangerBlock}>
          <Text style={styles.dangerEyebrow}>Zone irréversible</Text>
          <Text style={styles.dangerDescription}>
            Pour effacer définitivement votre compte et toutes vos pages,
            inscrivez{' '}
            <Text style={styles.dangerKeyword}>EFFACER</Text>
            {' '}ci-dessous.
          </Text>
          <Input
            label="Confirmation"
            value={deleteConfirmText}
            onChangeText={setDeleteConfirmText}
            autoCapitalize="characters"
            containerStyle={styles.inputWrap}
          />
          <TouchableOpacity
            style={[styles.deleteBtn, deleteConfirmText !== 'EFFACER' && styles.deleteBtnDisabled]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  backText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.primary,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 44,
    lineHeight: 42,
    letterSpacing: -1.5,
    color: T.text,
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionBlock: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 0,
  },
  sectionEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 20,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  themeLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.textDim,
  },
  currentEmail: {
    fontFamily: F.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    color: T.textFaint,
    marginBottom: 16,
  },
  inputWrap: { marginBottom: 16 },
  showToggle: {
    paddingBottom: 4,
  },
  showToggleText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  updateBtn: {
    backgroundColor: T.primary,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  updateBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.text,
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  signOutLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.textDim,
  },
  signOutArrow: {
    fontFamily: F.sansLight,
    fontSize: 22,
    color: T.textFaint,
  },
  dangerBlock: {
    paddingHorizontal: 24,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: T.primary + '33',
    marginTop: 32,
  },
  dangerEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 12,
  },
  dangerDescription: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: T.textDim,
    marginBottom: 20,
  },
  dangerKeyword: {
    fontFamily: F.mono,
    fontSize: 13,
    color: T.primary,
    fontStyle: 'normal',
  },
  deleteBtn: {
    borderWidth: 1,
    borderColor: T.primary,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteBtnDisabled: { opacity: 0.3 },
  deleteBtnText: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.primary,
  },
  snackbar: { backgroundColor: T.surface2 },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar, TextInput as PaperInput } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';

export default function Settings() {
  const { user, signOut } = useAuth();
  const reset = useAuthStore((s) => s.reset);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      setSnackbar('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSnackbar('Les mots de passe ne correspondent pas.');
      return;
    }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setSnackbar('Erreur : ' + error.message);
    } else {
      setSnackbar('Mot de passe mis à jour !');
      setNewPassword('');
      setConfirmPassword('');
    }
    setSavingPwd(false);
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
    if (deleteConfirmText !== 'SUPPRIMER') {
      setSnackbar('Tapez exactement "SUPPRIMER" pour confirmer.');
      return;
    }
    if (!user) return;

    Alert.alert(
      'Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account', {
              body: { userId: user.id },
            });
            if (error) {
              setSnackbar('Erreur lors de la suppression.');
              return;
            }
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
      <ScrollView keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Paramètres</Text>

        {/* Changer le mot de passe */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Changer le mot de passe</Text>
          <Input
            label="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            right={
              <PaperInput.Icon
                icon={showNew ? 'eye-off' : 'eye'}
                onPress={() => setShowNew(!showNew)}
                color="#888888"
              />
            }
            style={styles.input}
          />
          <Input
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            right={
              <PaperInput.Icon
                icon={showConfirm ? 'eye-off' : 'eye'}
                onPress={() => setShowConfirm(!showConfirm)}
                color="#888888"
              />
            }
            style={styles.input}
          />
          <TouchableOpacity
            style={[styles.primaryButton, savingPwd && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={savingPwd}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {savingPwd ? 'Sauvegarde...' : 'Mettre à jour le mot de passe'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Suppression du compte */}
        <View style={styles.dangerSection}>
          <Text style={styles.dangerTitle}>Zone de danger</Text>
          <Text style={styles.dangerDescription}>
            Pour supprimer définitivement votre compte, tapez{' '}
            <Text style={styles.dangerKeyword}>SUPPRIMER</Text> ci-dessous.
          </Text>
          <Input
            label="Confirmez avec SUPPRIMER"
            value={deleteConfirmText}
            onChangeText={setDeleteConfirmText}
            autoCapitalize="characters"
            style={styles.input}
          />
          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleteConfirmText !== 'SUPPRIMER' && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Text style={styles.deleteButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingTop: 56,
  },
  backButton: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backText: {
    color: '#e91e8c',
    fontSize: 14,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#e91e8c',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  signOutButton: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  signOutText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
  dangerSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f4433633',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 40,
  },
  dangerTitle: {
    color: '#f44336',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dangerDescription: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  dangerKeyword: {
    color: '#f44336',
    fontWeight: 'bold',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

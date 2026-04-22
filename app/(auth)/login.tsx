import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { TextInput as PaperInput } from 'react-native-paper';
import { Input } from '@/components/ui/Input';
import { T } from '@/constants/theme';

export default function Login() {
  const { fetchProfile } = useAuth();
  const { setSession } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setSnackbar('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setSnackbar('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }
    if (data.session) {
      setSession(data.session);
    }
    if (data.user) {
      await fetchProfile(data.user.id);
    }
    setLoading(false);
    router.replace('/(app)/map');
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setSnackbar('Entrez votre email pour réinitialiser le mot de passe.');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) {
      setSnackbar('Erreur lors de l\'envoi. Vérifiez votre email.');
    } else {
      setSnackbar('Email de réinitialisation envoyé !');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.logoEyebrow}>Bienvenue sur</Text>
          <Text style={styles.logoText}>LoveMap</Text>
        </View>

        <Text style={styles.eyebrow}>Email</Text>
        <Input
          label=""
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.eyebrow}>Mot de passe</Text>
        <Input
          label=""
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          right={
            <PaperInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
              color={T.textFaint}
            />
          }
          style={styles.input}
        />

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
          <Text style={styles.linkText}>Mot de passe oublié ?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Pas encore de compte ?{' '}
            <Text style={styles.registerTextBold}>S'inscrire</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.privacyRow}>
          <Text style={styles.privacyText}>Chiffré · Privé par défaut · RGPD</Text>
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
    backgroundColor: T.bg,
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 72,
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoEyebrow: {
    fontSize: 14,
    color: T.textDim,
    marginBottom: 4,
  },
  logoText: {
    fontSize: 52,
    fontWeight: '300',
    color: T.primary,
    letterSpacing: -1.5,
    fontStyle: 'italic',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    marginBottom: 16,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 28,
  },
  linkText: {
    color: T.primary,
    fontSize: 12,
  },
  button: {
    backgroundColor: T.primary,
    borderRadius: T.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  registerLink: {
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: T.pill,
    borderWidth: 1,
    borderColor: T.border,
  },
  registerText: {
    color: T.textDim,
    fontSize: 14,
  },
  registerTextBold: {
    color: T.text,
    fontWeight: '600',
  },
  privacyRow: {
    alignItems: 'center',
    marginTop: 32,
  },
  privacyText: {
    color: T.textFaint,
    fontSize: 11,
  },
  snackbar: {
    backgroundColor: T.surface2,
  },
});

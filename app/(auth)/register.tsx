import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Snackbar, TextInput as PaperInput } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';
import { T } from '@/constants/theme';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function Register() {
  const { dateOfBirth } = useAuthStore();
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Email invalide.';
    }
    if (password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }
    if (displayName.trim().length < 2 || displayName.trim().length > 30) {
      newErrors.displayName = 'Le nom doit contenir entre 2 et 30 caractères.';
    }
    if (username.trim().length < 3 || username.trim().length > 20 || !USERNAME_REGEX.test(username.trim())) {
      newErrors.username = 'Le pseudo doit contenir 3 à 20 caractères (lettres, chiffres, underscore).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      Alert.alert('Erreur inscription', error.message);
      return;
    }
    if (!data.user) {
      setLoading(false);
      Alert.alert('Erreur', 'Impossible de créer le compte.');
      return;
    }
    if (data.session) {
      await supabase.auth.setSession(data.session);
    }
    const { error: profileError } = await (supabase as any).from('profiles').insert({
      id: data.user.id,
      username: username.trim(),
      display_name: displayName.trim(),
      date_of_birth: dateOfBirth ?? null,
    });
    if (profileError) {
      setLoading(false);
      if (profileError.message.includes('unique') || profileError.message.includes('username')) {
        Alert.alert('Erreur inscription', 'Ce nom d\'utilisateur est déjà pris.');
      } else {
        Alert.alert('Erreur inscription', profileError.message);
      }
      return;
    }
    if (data.session) {
      setSession(data.session);
      setLoading(false);
      router.replace('/(app)/map');
    } else {
      setLoading(false);
      Alert.alert(
        'Vérifiez votre email',
        'Compte créé ! Confirmez votre email puis connectez-vous.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Créer un compte</Text>

        <Text style={styles.eyebrow}>Email</Text>
        <Input label="" value={email} onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

        <Text style={styles.eyebrow}>Mot de passe</Text>
        <Input
          label=""
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
          secureTextEntry={!showPassword}
          right={<PaperInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} color={T.textFaint} />}
          style={styles.input}
        />
        {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

        <Text style={styles.eyebrow}>Confirmer le mot de passe</Text>
        <Input
          label=""
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
          secureTextEntry={!showConfirm}
          right={<PaperInput.Icon icon={showConfirm ? 'eye-off' : 'eye'} onPress={() => setShowConfirm(!showConfirm)} color={T.textFaint} />}
          style={styles.input}
        />
        {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}

        <Text style={styles.eyebrow}>Nom d'affichage</Text>
        <Input label="" value={displayName} onChangeText={(v) => { setDisplayName(v); setErrors((e) => ({ ...e, displayName: '' })); }} style={styles.input} />
        {errors.displayName ? <Text style={styles.fieldError}>{errors.displayName}</Text> : null}

        <Text style={styles.eyebrow}>Pseudo (@username)</Text>
        <Input label="" value={username} onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: '' })); }} autoCapitalize="none" style={styles.input} />
        {errors.username ? <Text style={styles.fieldError}>{errors.username}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>{loading ? 'Création...' : 'Créer mon compte'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.loginLink}>
          <Text style={styles.loginText}>
            Déjà un compte ?{' '}
            <Text style={styles.loginTextBold}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={4000} style={styles.snackbar}>
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
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '300',
    fontStyle: 'italic',
    color: T.text,
    letterSpacing: -1,
    marginBottom: 32,
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
    marginBottom: 4,
  },
  fieldError: {
    color: T.danger,
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  button: {
    backgroundColor: T.primary,
    borderRadius: T.pill,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
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
  loginLink: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: T.pill,
    borderWidth: 1,
    borderColor: T.border,
  },
  loginText: {
    color: T.textDim,
    fontSize: 14,
  },
  loginTextBold: {
    color: T.text,
    fontWeight: '600',
  },
  snackbar: {
    backgroundColor: T.surface2,
  },
});

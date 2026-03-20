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
import { Snackbar, TextInput as PaperInput } from 'react-native-paper';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Input } from '@/components/ui/Input';

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

  // Field errors
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
    if (
      username.trim().length < 3 ||
      username.trim().length > 20 ||
      !USERNAME_REGEX.test(username.trim())
    ) {
      newErrors.username =
        'Le pseudo doit contenir 3 à 20 caractères (lettres, chiffres, underscore).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim(),
          display_name: displayName.trim(),
          date_of_birth: dateOfBirth,
        },
      },
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        setSnackbar('Un compte existe déjà avec cet email.');
      } else if (error.message.includes('unique') || error.message.includes('username')) {
        setSnackbar('Ce nom d\'utilisateur est déjà pris.');
      } else {
        setSnackbar(error.message);
      }
      setLoading(false);
      return;
    }

    if (data.session) {
      setSession(data.session);
      setLoading(false);
      router.replace('/(app)/map');
    } else {
      setLoading(false);
      setSnackbar('Compte créé ! Vérifiez votre email pour confirmer votre compte.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>💗 LoveMap</Text>
        </View>

        <Text style={styles.title}>Créer un compte</Text>

        {/* Email */}
        <Input
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: '' })); }}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />
        {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

        {/* Mot de passe */}
        <Input
          label="Mot de passe"
          value={password}
          onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: '' })); }}
          secureTextEntry={!showPassword}
          right={
            <PaperInput.Icon
              icon={showPassword ? 'eye-off' : 'eye'}
              onPress={() => setShowPassword(!showPassword)}
              color="#888888"
            />
          }
          style={styles.input}
        />
        {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

        {/* Confirmation */}
        <Input
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: '' })); }}
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
        {errors.confirmPassword ? (
          <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
        ) : null}

        {/* Nom d'affichage */}
        <Input
          label="Nom d'affichage"
          value={displayName}
          onChangeText={(v) => { setDisplayName(v); setErrors((e) => ({ ...e, displayName: '' })); }}
          style={styles.input}
        />
        {errors.displayName ? <Text style={styles.fieldError}>{errors.displayName}</Text> : null}

        {/* Username */}
        <Input
          label="Nom d'utilisateur (@pseudo)"
          value={username}
          onChangeText={(v) => { setUsername(v); setErrors((e) => ({ ...e, username: '' })); }}
          autoCapitalize="none"
          style={styles.input}
        />
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

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
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
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e91e8c',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 4,
  },
  fieldError: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#e91e8c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    color: '#888888',
    fontSize: 14,
  },
  loginTextBold: {
    color: '#e91e8c',
    fontWeight: '600',
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

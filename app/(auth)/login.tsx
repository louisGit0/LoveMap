import React, { useState, useMemo } from 'react';
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
import { Snackbar } from 'react-native-paper';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { AppText } from '@/components/ui/AppText';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { haptics } from '@/lib/haptics';
import type { Theme } from '@/constants/theme';

export default function Login() {
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Connexion impossible. Vérifiez vos identifiants.'); return; }
    setLoading(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (e) { setError('Connexion impossible. Vérifiez vos identifiants.'); return; }
    router.replace('/(app)/map');
  }

  async function handleForgot() {
    if (!email.trim()) { Alert.alert('Entrez votre adresse email d\'abord.'); return; }
    await supabase.auth.resetPasswordForEmail(email.trim());
    Alert.alert('Email de réinitialisation envoyé.');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* En-tête couverture */}
          <AppText variant="eyebrow" style={styles.eyebrow}>
            LOVEMAP · ÉDITION INTIME
          </AppText>
          <AppText variant="display" style={styles.hero} numberOfLines={1}>
            LoveMap
          </AppText>

          {/* Formulaire — immédiatement visible */}
          <View style={styles.form}>
            <Input
              label="E-MAIL"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.fieldValue}
              maxFontSizeMultiplier={1.8}
              containerStyle={styles.field}
            />

            <View style={styles.field}>
              <Input
                label="MOT DE PASSE"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPwd}
                style={styles.fieldValue}
                maxFontSizeMultiplier={1.8}
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.showPwdBtn}>
                <Text style={styles.showPwdText}>{showPwd ? 'masquer' : 'voir'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleForgot} style={styles.forgotBtn}>
              <Text style={styles.forgotText}>oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* CTA unique */}
          <View style={styles.actions}>
            <Button
              onPress={() => { haptics.tap(); handleLogin(); }}
              disabled={loading}
              variant="coral"
              style={styles.cta}
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>

          {/* Ourlet mono */}
          <Text style={styles.hem}>ÉDITION N°01 · 2026</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 16,
  },
  hero: {
    fontSize: 56,
    lineHeight: 56,
    fontStyle: 'italic',
    letterSpacing: -1,
    color: T.text,
    marginBottom: 32,
  },
  form: { gap: 0 },
  field: { marginBottom: 24 },
  fieldValue: {
    fontFamily: F.sans,
    fontSize: 16,
    fontStyle: 'normal',
  },
  showPwdBtn: {
    position: 'absolute',
    right: 0,
    bottom: 12,
  },
  showPwdText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  forgotBtn: { alignSelf: 'flex-start', marginTop: 8 },
  forgotText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.textDim,
    textDecorationLine: 'underline',
  },
  actions: { marginTop: 32 },
  cta: {
    height: 52,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  secondaryBtn: { alignSelf: 'center', marginTop: 24, paddingVertical: 4 },
  secondaryText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textDim,
    textDecorationLine: 'underline',
  },
  hem: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    textAlign: 'center',
    marginTop: 48,
  },
  snackbar: { backgroundColor: T.surface2 },
});

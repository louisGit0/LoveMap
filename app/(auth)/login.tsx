import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IcoHeartDashed } from '@/components/icons';

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Champs requis manquants.'); return; }
    setLoading(true);
    setError(null);
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (e) { setError(e.message); return; }
    router.replace('/(app)/map');
  }

  async function handleForgot() {
    if (!email.trim()) { Alert.alert('Entrez votre adresse email d\'abord.'); return; }
    await supabase.auth.resetPasswordForEmail(email.trim());
    Alert.alert('Email de réinitialisation envoyé.');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 56 }]}>
      <View style={styles.innerBorder} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Wordmark */}
        <Text style={styles.tagline}>De retour, voyageur.</Text>
        <View style={styles.wordmark}>
          <Text style={styles.wordmarkText}>love</Text>
          <IcoHeartDashed size={16} color={T.primary} />
          <Text style={styles.wordmarkText}>map</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>
          <Input
            label="Adresse"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.inputWrap}
          />

          <View>
            <Input
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              containerStyle={styles.inputWrap}
            />
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.showPwdBtn}>
              <Text style={styles.showPwdText}>{showPwd ? 'masquer' : 'voir'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleForgot} style={{ marginTop: 12, alignSelf: 'flex-start' }}>
            <Text style={styles.forgotText}>oublié ?</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>↳ {error}</Text> : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button onPress={handleLogin} loading={loading} variant="solid">
            Se connecter
          </Button>

          <View style={styles.separator}>
            <View style={styles.sepLine} />
            <Text style={styles.sepText}>ou</Text>
            <View style={styles.sepLine} />
          </View>

          <Button onPress={() => router.push('/(auth)/register')} variant="ghost">
            Créer un compte
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  innerBorder: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 16,
    borderWidth: 1, borderColor: T.border,
  },
  scroll: {
    paddingHorizontal: 36,
    paddingBottom: 48,
    flexGrow: 1,
  },
  tagline: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: T.textDim,
    marginBottom: 8,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 44,
  },
  wordmarkText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 48,
    color: T.text,
    letterSpacing: -1,
    lineHeight: 52,
  },
  form: { gap: 0 },
  inputWrap: { marginBottom: 22 },
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
  forgotText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.textDim,
    textDecorationLine: 'underline',
  },
  errorText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 13,
    color: T.primary,
    marginTop: 8,
  },
  actions: { marginTop: 40, gap: 0 },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  sepLine: { flex: 1, height: 1, backgroundColor: T.border },
  sepText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
});

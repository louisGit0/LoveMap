import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function Register() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ email: '', pwd: '', pwd2: '', name: '', username: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function validate() {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Adresse invalide.';
    if (form.pwd.length < 8) e.pwd = 'Min. 8 caractères.';
    if (form.pwd !== form.pwd2) e.pwd2 = 'Les mots de passe diffèrent.';
    if (form.name.trim().length < 2) e.name = 'Requis.';
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(form.username)) e.username = '3 à 20 caractères alphanumériques.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    const dob = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.pwd,
      options: {
        data: {
          display_name: form.name.trim(),
          username: form.username.trim(),
          date_of_birth: dob,
        },
      },
    });
    setLoading(false);
    if (error) { setErrors({ email: error.message }); return; }
    router.replace('/(app)/map');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 56 }]}>
      <View style={styles.innerBorder} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.eyebrow}>N° 003 — Inscription</Text>

        <Text style={styles.title}>
          Bienvenue dans{'\n'}la cartographie{'\n'}
          <Text style={styles.titleAccent}>de l'intime.</Text>
        </Text>

        {[
          { key: 'email', label: 'Adresse email', type: 'email-address' as const, secure: false, cap: 'none' as const },
          { key: 'pwd', label: 'Mot de passe', type: 'default' as const, secure: true, cap: 'none' as const },
          { key: 'pwd2', label: 'Confirmer', type: 'default' as const, secure: true, cap: 'none' as const },
          { key: 'name', label: 'Prénom affiché', type: 'default' as const, secure: false, cap: 'words' as const },
          { key: 'username', label: 'Pseudo (@)', type: 'default' as const, secure: false, cap: 'none' as const },
        ].map(({ key, label, type, secure, cap }) => (
          <Input
            key={key}
            label={label}
            value={form[key as keyof typeof form]}
            onChangeText={(v) => set(key, v)}
            keyboardType={type}
            secureTextEntry={secure}
            autoCapitalize={cap}
            error={errors[key]}
            containerStyle={styles.inputWrap}
          />
        ))}

        <View style={styles.actions}>
          <Button onPress={handleRegister} loading={loading} variant="coral">
            Créer mon journal
          </Button>
          <Button onPress={() => router.back()} variant="ghost" style={{ marginTop: 10 }}>
            J'ai déjà un compte
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
  scroll: { paddingHorizontal: 36, paddingBottom: 48, flexGrow: 1 },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 24,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1,
    color: T.text,
    marginBottom: 40,
  },
  titleAccent: { color: T.primary },
  inputWrap: { marginBottom: 22 },
  actions: { marginTop: 32, gap: 0 },
});

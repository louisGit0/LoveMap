import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { IcoArrow } from '@/components/icons';
import { MIN_AGE } from '@/constants/config';
import type { Theme } from '@/constants/theme';

/* ─── Picker colonnes (réutilisé de l'ancien age-gate) ──────────────── */

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function PickerCol({
  items,
  selected,
  onSelect,
  label,
  format = (x: number) => String(x),
  styles,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
  format?: (v: number) => string;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerBox}>
        <FlatList
          data={items}
          keyExtractor={(item) => String(item)}
          showsVerticalScrollIndicator={false}
          initialScrollIndex={Math.max(0, items.indexOf(selected))}
          getItemLayout={(_, index) => ({ length: 36, offset: 36 * index, index })}
          renderItem={({ item }) => {
            const sel = item === selected;
            return (
              <TouchableOpacity
                onPress={() => onSelect(item)}
                style={[styles.pickerItem, sel && styles.pickerItemSel]}
                activeOpacity={0.8}
              >
                <Text style={[styles.pickerItemText, sel && styles.pickerItemTextSel]}>
                  {format(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
}

/* ─── Composant principal ────────────────────────────────────────────── */

export default function Register() {
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  /* Étape courante : 1 = vérification d'âge, 2 = formulaire d'inscription */
  const [step, setStep] = useState<1 | 2>(1);

  /* ── Étape 1 : date de naissance ── */
  const cy = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => cy - i);

  const [day, setDay] = useState(12);
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(1998);
  const [ageError, setAgeError] = useState<string | null>(null);

  function calcAge() {
    const today = new Date();
    const bd = new Date(year, month - 1, day);
    let age = today.getFullYear() - bd.getFullYear();
    const mm = today.getMonth() - bd.getMonth();
    if (mm < 0 || (mm === 0 && today.getDate() < bd.getDate())) age -= 1;
    return age;
  }

  function confirmAge() {
    if (calcAge() < MIN_AGE) {
      setAgeError('Accès interdit aux mineur·e·s.');
      return;
    }
    setAgeError(null);
    setStep(2);
  }

  /* ── Étape 2 : formulaire ── */
  const [form, setForm] = useState({ email: '', pwd: '', pwd2: '', name: '', username: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function setField(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

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
    const dob = new Date(year, month - 1, day).toISOString().slice(0, 10);
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

  /* ── Indicateur d'étape ── */
  const StepIndicator = () => (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, step === 1 && styles.stepDotActive]} />
      <View style={styles.stepLine} />
      <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
    </View>
  );

  /* ────────────────────── ÉTAPE 1 — Vérification d'âge ──────────────── */
  if (step === 1) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        <View style={styles.innerBorder} pointerEvents="none" />

        {/* Bouton retour → login */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 16 }]}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <IcoArrow size={18} color={T.textFaint} dir="left" />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <StepIndicator />

          {/* Titre */}
          <View style={styles.titleBlock}>
            <Text style={styles.titleLine1}>Réservé</Text>
            <Text style={styles.titleLine2}>aux adultes.</Text>
          </View>

          {/* Sous-titre */}
          <View style={styles.subtitleRow}>
            <View style={styles.trait} />
            <Text style={styles.subtitle}>
              LoveMap cartographie vos moments intimes.{'\n'}
              <Text style={styles.subtitleItalic}>L'accès est strictement limité aux personnes majeures.</Text>
            </Text>
          </View>

          {/* Pickers */}
          <Text style={styles.pickerEyebrow}>↳ Date de naissance</Text>
          <View style={styles.pickers}>
            <PickerCol label="Jour" items={days} selected={day} onSelect={setDay} format={(x) => String(x).padStart(2, '0')} styles={styles} />
            <PickerCol label="Mois" items={months} selected={month} onSelect={setMonth} format={(x) => MOIS[x - 1]} styles={styles} />
            <PickerCol label="Année" items={years} selected={year} onSelect={setYear} styles={styles} />
          </View>

          {ageError ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{ageError}</Text>
            </View>
          ) : null}

          <View style={{ flex: 1, minHeight: 32 }} />

          {/* Bouton suivant */}
          <TouchableOpacity onPress={confirmAge} style={styles.enterBtn} activeOpacity={0.88}>
            <View style={styles.enterLeft}>
              <Text style={styles.enterEyebrow}>Accès majeur</Text>
              <Text style={styles.enterLabel}>Continuer</Text>
            </View>
            <View style={styles.enterArrow}>
              <IcoArrow size={20} color={T.primary} dir="right" />
            </View>
          </TouchableOpacity>

          <Text style={styles.footer}>✦ Vérifié côté serveur ✦ Jamais partagé ✦</Text>
        </ScrollView>
      </View>
    );
  }

  /* ────────────────────── ÉTAPE 2 — Formulaire d'inscription ─────────── */
  return (
    <View style={[styles.container, { paddingTop: insets.top + 56 }]}>
      <View style={styles.innerBorder} pointerEvents="none" />

      {/* Bouton retour → étape 1 */}
      <TouchableOpacity
        onPress={() => setStep(1)}
        style={[styles.backBtn, { top: insets.top + 16 }]}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <IcoArrow size={18} color={T.textFaint} dir="left" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <StepIndicator />

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
            onChangeText={(v) => setField(key, v)}
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

/* ─── Styles ─────────────────────────────────────────────────────────── */

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  backBtn: {
    position: 'absolute',
    left: 24,
    zIndex: 10,
    padding: 4,
  },
  innerBorder: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 16,
    borderWidth: 1, borderColor: T.border,
  },
  scroll: { paddingHorizontal: 36, paddingBottom: 48, flexGrow: 1 },

  /* Indicateur d'étape */
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.border,
  },
  stepDotActive: {
    backgroundColor: T.primary,
  },
  stepLine: {
    flex: 0,
    width: 24,
    height: 1,
    backgroundColor: T.border,
    marginHorizontal: 6,
  },

  /* Étape 1 — âge */
  titleBlock: { marginBottom: 24 },
  titleLine1: {
    fontFamily: F.serifLight,
    fontSize: 64,
    lineHeight: 60,
    letterSpacing: -2,
    color: T.text,
    fontStyle: 'italic',
  },
  titleLine2: {
    fontFamily: F.serifLight,
    fontSize: 64,
    lineHeight: 60,
    letterSpacing: -2,
    color: T.primary,
    fontStyle: 'italic',
    marginLeft: 38,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 32,
  },
  trait: {
    width: 24,
    height: 1,
    backgroundColor: T.primary,
    marginTop: 10,
    flexShrink: 0,
  },
  subtitle: {
    fontFamily: F.sansLight,
    fontSize: 13,
    lineHeight: 20,
    color: T.textDim,
    flex: 1,
  },
  subtitleItalic: {
    fontFamily: F.serif,
    fontSize: 14,
    color: T.textFaint,
    fontStyle: 'italic',
  },
  pickerEyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 14,
  },
  pickers: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  pickerLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 8,
  },
  pickerBox: {
    height: 156,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  pickerItem: {
    height: 36,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  pickerItemSel: { backgroundColor: T.primary },
  pickerItemText: {
    fontFamily: F.sans,
    fontSize: 13,
    color: T.textDim,
  },
  pickerItemTextSel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
  },
  errorBlock: {
    borderLeftWidth: 2,
    borderLeftColor: T.primary,
    paddingLeft: 12,
    marginBottom: 18,
  },
  errorText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.primary,
  },
  enterBtn: {
    flexDirection: 'row',
    height: 64,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
  enterLeft: {
    flex: 1,
    backgroundColor: T.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 2,
  },
  enterEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.text,
    opacity: 0.7,
  },
  enterLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 26,
    letterSpacing: -0.5,
    color: T.text,
    lineHeight: 28,
  },
  enterArrow: {
    width: 64,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    color: T.textFaint,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 16,
  },

  /* Étape 2 — formulaire */
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

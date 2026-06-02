import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
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
import { IcoArrow } from '@/components/icons';
import { haptics } from '@/lib/haptics';
import { APP_CONFIG } from '@/constants/config';
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
    if (calcAge() < APP_CONFIG.MIN_AGE) {
      haptics.warn();
      setAgeError('Vous devez avoir 18 ans ou plus.');
      return;
    }
    setAgeError(null);
    setStep(2);
  }

  /* ── Étape 2 : formulaire ── */
  const [form, setForm] = useState({ email: '', pwd: '', pwd2: '', name: '', username: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

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
    if (error) { setSnackbar('Inscription impossible. Réessayez.'); return; }
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
        {/* Bouton retour → login */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { top: insets.top + 16 }]}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <IcoArrow size={18} color={T.textFaint} dir="left" />
        </TouchableOpacity>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <StepIndicator />

          {/* En-tête couverture solennelle */}
          <AppText variant="eyebrow" style={styles.coverEyebrow}>
            VÉRIFICATION D'ÂGE
          </AppText>
          <AppText variant="display" style={styles.coverHero}>
            Quel âge avez-vous ?
          </AppText>
          <Text style={styles.helpText}>Vous devez avoir 18 ans ou plus pour entrer.</Text>

          {/* Pickers JJ/MM/AAAA (préservés) */}
          <Text style={styles.pickerEyebrow}>Date de naissance</Text>
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

          {/* CTA */}
          <Button
            onPress={() => { haptics.tap(); confirmAge(); }}
            variant="coral"
            style={styles.cta}
          >
            Vérifier mon âge
          </Button>
        </ScrollView>
      </View>
    );
  }

  /* ────────────────────── ÉTAPE 2 — Formulaire d'inscription ─────────── */
  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      {/* Bouton retour → étape 1 */}
      <TouchableOpacity
        onPress={() => setStep(1)}
        style={[styles.backBtn, { top: insets.top + 16 }]}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <IcoArrow size={18} color={T.textFaint} dir="left" />
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StepIndicator />

        {/* En-tête couverture (cohérent login) */}
        <AppText variant="eyebrow" style={styles.coverEyebrow}>
          N° 003 — INSCRIPTION
        </AppText>
        <AppText variant="display" style={styles.coverHero}>
          Votre carnet
        </AppText>

        <View style={styles.formGap} />

        {[
          { key: 'email', label: 'E-MAIL', type: 'email-address' as const, secure: false, cap: 'none' as const },
          { key: 'pwd', label: 'MOT DE PASSE', type: 'default' as const, secure: true, cap: 'none' as const },
          { key: 'pwd2', label: 'CONFIRMER', type: 'default' as const, secure: true, cap: 'none' as const },
          { key: 'name', label: 'PRÉNOM AFFICHÉ', type: 'default' as const, secure: false, cap: 'words' as const },
          { key: 'username', label: 'PSEUDO (@)', type: 'default' as const, secure: false, cap: 'none' as const },
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
            style={styles.fieldValue}
            maxFontSizeMultiplier={1.8}
            containerStyle={styles.inputWrap}
          />
        ))}

        <View style={styles.actions}>
          <Button
            onPress={() => { haptics.tap(); handleRegister(); }}
            loading={loading}
            variant="coral"
            style={styles.cta}
          >
            Commencer le carnet
          </Button>
          <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
            <Text style={styles.backLinkText}>Retour</Text>
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
  scroll: { paddingHorizontal: 24, flexGrow: 1 },

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

  /* En-tête couverture (partagé step 1 / step 2) */
  coverEyebrow: {
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 16,
  },
  coverHero: {
    fontSize: 56,
    lineHeight: 56,
    fontStyle: 'italic',
    letterSpacing: -1,
    color: T.text,
    marginBottom: 16,
  },
  helpText: {
    fontFamily: F.sans,
    fontSize: 16,
    lineHeight: 22,
    color: T.textDim,
    marginBottom: 32,
  },

  /* Étape 1 — pickers (préservés) */
  pickerEyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 16,
  },
  pickers: {
    flexDirection: 'row',
    gap: 8,
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
    paddingLeft: 16,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.primary,
  },

  /* Étape 2 — formulaire */
  formGap: { height: 32 },
  fieldValue: {
    fontFamily: F.sans,
    fontSize: 16,
    fontStyle: 'normal',
  },
  inputWrap: { marginBottom: 24 },
  actions: { marginTop: 32 },
  backLink: { alignSelf: 'center', marginTop: 24, paddingVertical: 4 },
  backLinkText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textDim,
    textDecorationLine: 'underline',
  },

  /* Partagé */
  cta: {
    height: 52,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  snackbar: { backgroundColor: T.surface2 },
});

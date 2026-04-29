import React, { useState } from 'react';
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
import { useAuthStore } from '@/stores/authStore';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoArrow } from '@/components/icons';
import { MIN_AGE } from '@/constants/config';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

function PickerCol({
  items,
  selected,
  onSelect,
  label,
  format = (x: number) => String(x),
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  label: string;
  format?: (v: number) => string;
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

export default function AgeGate() {
  const insets = useSafeAreaInsets();
  const { setAgeVerified } = useAuthStore();
  const [day, setDay] = useState(12);
  const [month, setMonth] = useState(5);
  const [year, setYear] = useState(1998);
  const [error, setError] = useState<string | null>(null);

  const cy = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => cy - i);

  function calcAge() {
    const today = new Date();
    const bd = new Date(year, month - 1, day);
    let age = today.getFullYear() - bd.getFullYear();
    const mm = today.getMonth() - bd.getMonth();
    if (mm < 0 || (mm === 0 && today.getDate() < bd.getDate())) age -= 1;
    return age;
  }

  function confirm() {
    if (calcAge() < MIN_AGE) {
      setError('Accès interdit aux mineur·e·s.');
      return;
    }
    const dob = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAgeVerified(true, dob);
    router.replace('/(auth)/login');
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
      {/* Bordure intérieure effet carnet */}
      <View style={styles.innerBorder} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
          <PickerCol label="Jour" items={days} selected={day} onSelect={setDay} format={(x) => String(x).padStart(2, '0')} />
          <PickerCol label="Mois" items={months} selected={month} onSelect={setMonth} format={(x) => MOIS[x - 1]} />
          <PickerCol label="Année" items={years} selected={year} onSelect={setYear} />
        </View>

        {error ? (
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={{ flex: 1, minHeight: 32 }} />

        {/* Bouton "Entrer" */}
        <TouchableOpacity onPress={confirm} style={styles.enterBtn} activeOpacity={0.88}>
          <View style={styles.enterLeft}>
            <Text style={styles.enterEyebrow}>Accès majeur</Text>
            <Text style={styles.enterLabel}>Entrer</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  innerBorder: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  scroll: {
    paddingHorizontal: 36,
    paddingBottom: 36,
    flexGrow: 1,
  },
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
});

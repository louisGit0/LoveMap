import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { APP_CONFIG } from '@/constants/config';
import { T } from '@/constants/theme';

const MIN_AGE = APP_CONFIG.MIN_AGE;

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => currentYear - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

function Picker({
  items,
  selected,
  onSelect,
  label,
}: {
  items: (string | number)[];
  selected: string | number;
  onSelect: (v: string | number) => void;
  label: string;
}) {
  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <ScrollView
        style={styles.pickerScroll}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.pickerItem, selected === item && styles.pickerItemSelected]}
            onPress={() => onSelect(item)}
          >
            <Text style={[styles.pickerItemText, selected === item && styles.pickerItemTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function AgeGate() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const setAgeVerified = useAuthStore((s) => s.setAgeVerified);

  const [day, setDay] = useState<number>(1);
  const [month, setMonth] = useState<number>(1);
  const [year, setYear] = useState<number>(currentYear - 20);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  function calculateAge(): number {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }
    return age;
  }

  function handleConfirm() {
    const age = calculateAge();
    if (age < MIN_AGE) {
      setError('Vous devez avoir 18 ans pour accéder à LoveMap.');
      return;
    }
    setError(null);
    const dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setAgeVerified(true, dateOfBirth);
    router.replace('/(auth)/login');
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>━━  18 +</Text>
        <Text style={styles.title}>Réservé{'\n'}<Text style={styles.titleAccent}>aux adultes</Text>.</Text>
        <Text style={styles.subtitle}>
          LoveMap cartographie des moments intimes. L'accès est strictement limité aux personnes majeures.
        </Text>

        <Text style={styles.sectionLabel}>Date de naissance</Text>
        <View style={styles.pickersRow}>
          <Picker label="JJ" items={DAYS} selected={day} onSelect={(v) => setDay(v as number)} />
          <Picker label="MM" items={MONTHS} selected={MONTHS[month - 1]} onSelect={(v) => setMonth(MONTHS.indexOf(v as string) + 1)} />
          <Picker label="AAAA" items={YEARS} selected={year} onSelect={(v) => setYear(v as number)} />
        </View>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyText}>Vérifié côté serveur. Jamais partagé avec d'autres utilisateurs.</Text>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleConfirm} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Entrer dans LoveMap</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 72,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    fontWeight: '500',
    marginBottom: 16,
  },
  title: {
    fontSize: 52,
    fontWeight: '300',
    fontStyle: 'italic',
    color: T.text,
    lineHeight: 52,
    letterSpacing: -1.5,
    marginBottom: 18,
  },
  titleAccent: {
    color: T.primary,
  },
  subtitle: {
    fontSize: 15,
    color: T.textDim,
    lineHeight: 24,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    fontWeight: '500',
    marginBottom: 12,
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    color: T.textFaint,
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  pickerScroll: {
    height: 150,
    width: '100%',
    backgroundColor: T.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: T.border,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: T.primary + '22',
  },
  pickerItemText: {
    color: T.textFaint,
    fontSize: 14,
  },
  pickerItemTextSelected: {
    color: T.primary,
    fontWeight: '600',
  },
  privacyCard: {
    backgroundColor: T.surface,
    borderRadius: T.cardRadius,
    borderWidth: 1,
    borderColor: T.border,
    padding: 14,
    marginBottom: 14,
  },
  privacyText: {
    fontSize: 12,
    color: T.textDim,
    lineHeight: 18,
  },
  errorText: {
    color: T.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: T.primary,
    borderRadius: T.pill,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

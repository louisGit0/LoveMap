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
import { MIN_AGE } from '@/constants/config';

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
    setAgeVerified(true);
    router.replace('/(auth)/login');
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.inner}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>💗 LoveMap</Text>
        </View>

        <Text style={styles.title}>Réservé aux adultes</Text>
        <Text style={styles.subtitle}>
          En continuant, vous confirmez avoir 18 ans ou plus et acceptez les conditions d'utilisation.
        </Text>

        {/* Date pickers */}
        <View style={styles.pickersRow}>
          <Picker
            label="Jour"
            items={DAYS}
            selected={day}
            onSelect={(v) => setDay(v as number)}
          />
          <Picker
            label="Mois"
            items={MONTHS}
            selected={MONTHS[month - 1]}
            onSelect={(v) => setMonth(MONTHS.indexOf(v as string) + 1)}
          />
          <Picker
            label="Année"
            items={YEARS}
            selected={year}
            onSelect={(v) => setYear(v as number)}
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleConfirm} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Confirmer mon âge</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: '90%',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e91e8c',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  pickersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerScroll: {
    height: 150,
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#e91e8c22',
  },
  pickerItemText: {
    color: '#888888',
    fontSize: 14,
  },
  pickerItemTextSelected: {
    color: '#e91e8c',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#f44336',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#e91e8c',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

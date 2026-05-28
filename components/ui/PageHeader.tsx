import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { IcoArrow } from '@/components/icons';
import type { Theme } from '@/constants/theme';

interface Props {
  eyebrow?: string;
  title: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
  onBack?: () => void;
}

export function PageHeader({ eyebrow, title, backLabel, rightSlot, onBack }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      {/* Ligne retour + slot droit */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <IcoArrow size={16} color={T.primary} dir="left" />
          {backLabel ? <Text style={styles.backLabel}>{backLabel}</Text> : null}
        </TouchableOpacity>
        {rightSlot ? <View style={styles.rightSlot}>{rightSlot}</View> : null}
      </View>

      {/* Eyebrow */}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}

      {/* Titre */}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const makeStyles = (T: Theme) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 24,
      paddingBottom: 16,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    backLabel: {
      fontFamily: F.serif,
      fontStyle: 'italic',
      fontSize: 15,
      color: T.primary,
    },
    rightSlot: {
      alignItems: 'flex-end',
    },
    eyebrow: {
      fontFamily: F.mono,
      fontSize: 9,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: T.textFaint,
      marginBottom: 6,
    },
    title: {
      fontFamily: F.serifLight,
      fontStyle: 'italic',
      fontSize: 44,
      lineHeight: 42,
      letterSpacing: -1.5,
      color: T.text,
    },
  });

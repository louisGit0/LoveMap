// Input sans bordure encadrée — juste une ligne en bas (direction éditoriale)
import React, { useMemo } from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  right?: React.ReactNode;
}

export function Input({ label, error, containerStyle, style, right, ...props }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <View style={styles.inputRow}>
        <TextInput
          placeholderTextColor={T.textFaint}
          style={[styles.input, style]}
          {...props}
        />
        {right ? right : null}
      </View>
      {error ? (
        <Text style={styles.error}>↳ {error}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { marginBottom: 0 },
  label: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontFamily: F.serif,
    fontSize: 20,
    fontStyle: 'italic',
    color: T.text,
    borderRadius: 0,
  },
  error: {
    fontFamily: F.serif,
    fontSize: 13,
    fontStyle: 'italic',
    color: T.primary,
    marginTop: 4,
  },
});

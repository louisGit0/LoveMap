// Input sans bordure encadrée — juste une ligne en bas (direction éditoriale)
import React from 'react';
import {
  TextInput,
  Text,
  View,
  StyleSheet,
  TextInputProps,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, containerStyle, style, ...props }: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={T.textFaint}
        style={[styles.input, style]}
        {...props}
      />
      {error ? (
        <Text style={styles.error}>↳ {error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 0 },
  label: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
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

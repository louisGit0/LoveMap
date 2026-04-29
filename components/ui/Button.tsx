import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';

type Variant = 'solid' | 'coral' | 'ghost' | 'danger' | 'underline';

interface Props {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

export function Button({
  onPress,
  disabled,
  loading,
  children,
  variant = 'coral',
  style,
  fullWidth = true,
}: Props) {
  if (variant === 'underline') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[{ paddingVertical: 4, alignSelf: 'flex-start' }, style]}
        activeOpacity={0.7}
      >
        <Text style={styles.underlineText}>{children}</Text>
      </TouchableOpacity>
    );
  }

  const variantStyle = {
    solid: styles.solid,
    coral: styles.coral,
    ghost: styles.ghost,
    danger: styles.danger,
  }[variant];

  const textStyle = {
    solid: styles.solidText,
    coral: styles.coralText,
    ghost: styles.ghostText,
    danger: styles.dangerText,
  }[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        variantStyle,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? T.bg : T.text} size="small" />
      ) : (
        <Text style={[styles.baseText, textStyle]}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 0,
    paddingHorizontal: 22,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.4 },

  solid: { backgroundColor: T.text },
  coral: {
    backgroundColor: T.primary,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.border },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.danger + '66' },

  baseText: { fontFamily: F.sansMedium, fontSize: 14, letterSpacing: 0.2 },
  solidText: { color: T.bg },
  coralText: { color: T.text },
  ghostText: { color: T.text },
  dangerText: { color: T.danger },

  underlineText: {
    fontFamily: F.serif,
    fontSize: 18,
    fontStyle: 'italic',
    color: T.text,
    textDecorationLine: 'underline',
  },
});

import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';
import { T } from '@/constants/theme';

interface Props {
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: string;
  variant?: 'primary' | 'ghost';
  style?: ViewStyle;
}

export function Button({ onPress, disabled, loading, children, variant = 'primary', style }: Props) {
  const isPrimary = variant === 'primary';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[isPrimary ? styles.primary : styles.ghost, (disabled || loading) && styles.disabled, style]}
    >
      {loading
        ? <ActivityIndicator color={isPrimary ? '#fff' : T.text} size="small" />
        : <Text style={isPrimary ? styles.primaryText : styles.ghostText}>{children}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: T.primary,
    borderRadius: T.pill,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: T.pill,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  primaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  ghostText: {
    color: T.text,
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.5,
  },
});

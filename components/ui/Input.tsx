import { TextInput } from 'react-native-paper';
import type { ComponentProps } from 'react';
import { T } from '@/constants/theme';

type Props = ComponentProps<typeof TextInput>;

export function Input({ style, ...props }: Props) {
  return (
    <TextInput
      mode="outlined"
      outlineColor={T.border}
      activeOutlineColor={T.primary}
      textColor={T.text}
      outlineStyle={{ borderRadius: 14 }}
      style={[{ backgroundColor: T.surface }, style]}
      placeholderTextColor={T.textFaint}
      {...props}
    />
  );
}

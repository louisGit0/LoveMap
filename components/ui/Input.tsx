import { TextInput } from 'react-native-paper';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof TextInput>;

export function Input({ style, ...props }: Props) {
  return (
    <TextInput
      mode="outlined"
      outlineColor="#333"
      activeOutlineColor="#e91e8c"
      textColor="#fff"
      style={[{ backgroundColor: '#1a1a1a' }, style]}
      {...props}
    />
  );
}

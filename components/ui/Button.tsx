import { Button as PaperButton } from 'react-native-paper';
import type { ComponentProps } from 'react';

type Props = ComponentProps<typeof PaperButton>;

export function Button({ style, ...props }: Props) {
  return (
    <PaperButton
      mode="contained"
      style={[{ borderRadius: 12 }, style]}
      {...props}
    />
  );
}

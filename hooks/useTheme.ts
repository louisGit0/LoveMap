import { useThemeStore } from '@/stores/themeStore';
import { darkTheme, lightTheme } from '@/constants/theme';
import type { Theme } from '@/constants/theme';

export function useTheme(): Theme {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkTheme : lightTheme;
}

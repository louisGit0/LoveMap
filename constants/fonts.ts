// Trois familles typographiques — direction "journal intime"
// Cormorant Garamond : titres, notes, éléments expressifs (serif italic)
// Inter Tight        : corps UI, boutons, inputs
// JetBrains Mono     : eyebrows, metadata, dates, labels uppercase

export const F = {
  // Cormorant Garamond — serif italic
  serif: 'CormorantGaramond_400Regular_Italic',
  serifLight: 'CormorantGaramond_300Light_Italic',
  serifMedium: 'CormorantGaramond_500Medium_Italic',

  // Inter Tight — sans-serif
  sans: 'InterTight_400Regular',
  sansLight: 'InterTight_300Light',
  sansMedium: 'InterTight_500Medium',
  sansSemi: 'InterTight_600SemiBold',

  // JetBrains Mono — monospace
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

// Exports pour useFonts()
export {
  CormorantGaramond_300Light_Italic,
  CormorantGaramond_400Regular_Italic,
  CormorantGaramond_500Medium_Italic,
} from '@expo-google-fonts/cormorant-garamond';

export {
  InterTight_300Light,
  InterTight_400Regular,
  InterTight_500Medium,
  InterTight_600SemiBold,
} from '@expo-google-fonts/inter-tight';

export {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

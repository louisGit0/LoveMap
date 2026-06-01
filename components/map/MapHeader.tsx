import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { AppText } from '@/components/ui/AppText';
import { IcoHeat, IcoPin } from '@/components/icons';
import { haptics } from '@/lib/haptics';
import type { Theme } from '@/constants/theme';

// Surface du bandeau : translucide sombre LISIBLE (règle 13 — aucun flou natif).
// Le bandeau flotte AU-DESSUS de la carte Mapbox (toujours sombre, #08080a), donc
// une surface sombre semi-opaque est correcte en thème dark ET light (overlay carte,
// pas surface d'app). Constante d'overlay assumée, hors échelle de tokens couleur.
const BAND_SURFACE = 'rgba(10,10,10,0.92)';

interface Props {
  viewMode: 'pins' | 'heatmap';
  onViewModeChange: (mode: 'pins' | 'heatmap') => void;
  friendName?: string | null;
  onFriendClear?: () => void;
  pointCount?: number;
  leftSlot?: React.ReactNode;
}

export function MapHeader({ viewMode, onViewModeChange, friendName, onFriendClear, pointCount = 0, leftSlot }: Props) {
  const insets = useSafeAreaInsets();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const title = friendName
    ? `carte de ${friendName}`
    : `mes moments · ${String(pointCount).padStart(2, '0')}`;

  function handleSelectMode(mode: 'pins' | 'heatmap') {
    haptics.select();
    onViewModeChange(mode);
  }

  return (
    <View style={[styles.container, { top: insets.top + 8 }]}>
      {/* Ligne titre */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <AppText variant="eyebrow" style={styles.eyebrow}>lovemap</AppText>
          <View style={styles.titleLine}>
            <AppText variant="title" style={styles.title} numberOfLines={1}>{title}</AppText>
            {friendName && (
              <TouchableOpacity onPress={onFriendClear} style={styles.clearBtn} activeOpacity={0.7}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Bouton VUE (FriendSelector) */}
        {leftSlot && (
          <View style={styles.vueSlot}>{leftSlot}</View>
        )}
      </View>

      {/* Toggle segmenté Points / Heatmap */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'pins' && styles.toggleBtnActive]}
          onPress={() => handleSelectMode('pins')}
          activeOpacity={0.8}
        >
          <IcoPin size={12} color={viewMode === 'pins' ? T.text : T.textFaint} />
          <Text style={[styles.toggleText, viewMode === 'pins' && styles.toggleTextActive]}>
            Points
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'heatmap' && styles.toggleBtnActive]}
          onPress={() => handleSelectMode('heatmap')}
          activeOpacity={0.8}
        >
          <IcoHeat size={12} color={viewMode === 'heatmap' ? T.text : T.textFaint} />
          <Text style={[styles.toggleText, viewMode === 'heatmap' && styles.toggleTextActive]}>
            Heatmap
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: BAND_SURFACE,
    borderRadius: T.radiusLg,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleLeft: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 2,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  clearBtn: {
    padding: 2,
  },
  clearText: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textFaint,
  },
  vueSlot: {
    marginLeft: 8,
  },
  toggle: {
    flexDirection: 'row',
    gap: 4,
    padding: 3,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: T.radiusXs,
    borderCurve: 'continuous',
  },
  toggleBtnActive: {
    backgroundColor: T.primary,
  },
  toggleText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  toggleTextActive: {
    color: T.text,
  },
});

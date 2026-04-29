import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { IcoHeat, IcoPin } from '@/components/icons';
import type { Theme } from '@/constants/theme';

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

  return (
    <View style={[styles.container, { paddingTop: insets.top + 6 }]}>
      {/* Ligne titre */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Text style={styles.eyebrow}>lovemap</Text>
          <View style={styles.titleLine}>
            <Text style={styles.title}>{title}</Text>
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

      {/* Toggle MAP / HEATMAP */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'pins' && styles.toggleBtnActive]}
          onPress={() => onViewModeChange('pins')}
          activeOpacity={0.8}
        >
          <IcoPin size={12} color={viewMode === 'pins' ? T.text : T.textFaint} />
          <Text style={[styles.toggleText, viewMode === 'pins' && styles.toggleTextActive]}>
            Map
          </Text>
        </TouchableOpacity>
        <View style={styles.toggleDivider} />
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'heatmap' && styles.toggleBtnActive]}
          onPress={() => onViewModeChange('heatmap')}
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
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: T.bg + 'e8',
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  titleLeft: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: F.mono,
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
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: T.text,
    letterSpacing: -0.3,
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
    marginLeft: 12,
  },
  toggle: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
  },
  toggleBtnActive: {
    backgroundColor: T.primary,
  },
  toggleDivider: {
    width: 1,
    backgroundColor: T.border,
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

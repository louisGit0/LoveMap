import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoPin, IcoHeat, IcoClose } from '@/components/icons';

interface Props {
  viewMode: 'pins' | 'heatmap';
  onViewModeChange: (mode: 'pins' | 'heatmap') => void;
  friendName?: string | null;
  onFriendClear?: () => void;
  leftSlot?: React.ReactNode;
}

export function MapHeader({ viewMode, onViewModeChange, friendName, onFriendClear, leftSlot }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        {/* Slot gauche (FriendSelector) */}
        {leftSlot ?? <View style={styles.spacer} />}

        {/* Toggle bandes horizontales */}
        <View style={styles.toggle}>
          <Text style={styles.toggleEyebrow}>lovemap</Text>
          <View style={styles.toggleBands}>
            <TouchableOpacity
              style={[styles.band, viewMode === 'pins' && styles.bandActive]}
              onPress={() => onViewModeChange('pins')}
              activeOpacity={0.8}
            >
              <IcoPin size={13} color={viewMode === 'pins' ? T.text : T.textFaint} />
              <Text style={[styles.bandText, viewMode === 'pins' && styles.bandTextActive]}>
                Map
              </Text>
            </TouchableOpacity>
            <View style={styles.bandDivider} />
            <TouchableOpacity
              style={[styles.band, viewMode === 'heatmap' && styles.bandActive]}
              onPress={() => onViewModeChange('heatmap')}
              activeOpacity={0.8}
            >
              <IcoHeat size={13} color={viewMode === 'heatmap' ? T.text : T.textFaint} />
              <Text style={[styles.bandText, viewMode === 'heatmap' && styles.bandTextActive]}>
                Heatmap
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.spacer} />
      </View>

      {/* Bandeau ami */}
      {friendName && (
        <View style={styles.friendBanner}>
          <Text style={styles.friendBannerLabel}>
            <Text style={styles.friendBannerEyebrow}>Carte de </Text>
            {friendName}
          </Text>
          <TouchableOpacity onPress={onFriendClear} style={styles.friendBannerClose} activeOpacity={0.7}>
            <IcoClose size={12} color={T.textFaint} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  spacer: { width: 44 },
  toggle: {
    backgroundColor: T.surface + 'f0',
    borderRadius: T.cardRadius,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  toggleEyebrow: {
    fontFamily: F.mono,
    fontSize: 7,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    textAlign: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
  },
  toggleBands: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  band: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 6,
  },
  bandActive: {
    backgroundColor: T.primary,
  },
  bandDivider: {
    width: 1,
    height: 20,
    backgroundColor: T.border,
  },
  bandText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  bandTextActive: {
    color: T.text,
  },
  friendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface + 'f0',
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 6,
    gap: 10,
  },
  friendBannerLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.text,
    flex: 1,
  },
  friendBannerEyebrow: {
    color: T.textFaint,
  },
  friendBannerClose: {
    padding: 4,
  },
});

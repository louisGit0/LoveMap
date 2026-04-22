import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { T } from '@/constants/theme';

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
        {leftSlot ?? <View style={styles.spacer} />}

        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.pill, viewMode === 'pins' && styles.pillActive]}
            onPress={() => onViewModeChange('pins')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="map-marker" size={16} color={viewMode === 'pins' ? '#fff' : T.textFaint} />
            <Text style={[styles.pillText, viewMode === 'pins' && styles.pillTextActive]}>Pins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, viewMode === 'heatmap' && styles.pillActive]}
            onPress={() => onViewModeChange('heatmap')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="fire" size={16} color={viewMode === 'heatmap' ? '#fff' : T.textFaint} />
            <Text style={[styles.pillText, viewMode === 'heatmap' && styles.pillTextActive]}>Heatmap</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </View>

      {friendName && (
        <View style={styles.friendBanner}>
          <Text style={styles.friendBannerText}>Carte de {friendName}</Text>
          <TouchableOpacity onPress={onFriendClear}>
            <Text style={styles.friendBannerClose}>✕</Text>
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
    flexDirection: 'row',
    backgroundColor: T.surface + 'ee',
    borderRadius: T.pill,
    borderWidth: 1,
    borderColor: T.border,
    padding: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: T.pill,
    gap: 6,
  },
  pillActive: {
    backgroundColor: T.primary,
  },
  pillText: {
    color: T.textFaint,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  friendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface + 'ee',
    borderRadius: T.pill,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 8,
  },
  friendBannerText: {
    color: T.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  friendBannerClose: {
    color: T.textFaint,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

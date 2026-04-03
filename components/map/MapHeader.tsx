import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Props {
  viewMode: 'pins' | 'heatmap';
  onViewModeChange: (mode: 'pins' | 'heatmap') => void;
  /** Nom de l'ami affiché (null = ma carte) */
  friendName?: string | null;
  onFriendClear?: () => void;
  /** Slot gauche pour le sélecteur d'ami */
  leftSlot?: React.ReactNode;
}

export function MapHeader({
  viewMode,
  onViewModeChange,
  friendName,
  onFriendClear,
  leftSlot,
}: Props) {
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
            <MaterialCommunityIcons
              name="map-marker"
              size={16}
              color={viewMode === 'pins' ? '#ffffff' : '#888'}
            />
            <Text style={[styles.pillText, viewMode === 'pins' && styles.pillTextActive]}>
              Pins
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pill, viewMode === 'heatmap' && styles.pillActive]}
            onPress={() => onViewModeChange('heatmap')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="fire"
              size={16}
              color={viewMode === 'heatmap' ? '#ffffff' : '#888'}
            />
            <Text style={[styles.pillText, viewMode === 'heatmap' && styles.pillTextActive]}>
              Heatmap
            </Text>
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
  spacer: {
    width: 44,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1aee',
    borderRadius: 24,
    padding: 3,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  pillActive: {
    backgroundColor: '#e91e8c',
  },
  pillText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  friendBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1aee',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 8,
    gap: 8,
  },
  friendBannerText: {
    color: '#e91e8c',
    fontSize: 13,
    fontWeight: '600',
  },
  friendBannerClose: {
    color: '#888888',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

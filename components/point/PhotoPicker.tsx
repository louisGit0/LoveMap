import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
type ImagePickerAsset = { uri: string; width: number; height: number; [key: string]: any };

interface Props {
  photos: ImagePickerAsset[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  maxPhotos?: number;
}

export function PhotoPicker({ photos, onAdd, onRemove, maxPhotos = 5 }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.thumbContainer}>
          <Image source={{ uri: photo.uri }} style={styles.thumb} />
          <TouchableOpacity style={styles.removeButton} onPress={() => onRemove(index)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      {photos.length < maxPhotos && (
        <TouchableOpacity style={styles.addButton} onPress={onAdd} activeOpacity={0.7}>
          <Text style={styles.addIcon}>+</Text>
          <Text style={styles.addLabel}>Photo</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  thumbContainer: {
    marginRight: 8,
    position: 'relative',
  },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    color: '#e91e8c',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addLabel: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
}

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

export function PointListItem({ point }: Props) {
  const color = noteColor(point.note);
  const dateStr = new Date(point.happened_at ?? point.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push(`/(app)/point/${point.id}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.noteBadge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={[styles.noteText, { color }]}>{point.note}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{dateStr}</Text>
          {point.partnerUsername && (
            <Text style={styles.partner}>@{point.partnerUsername}</Text>
          )}
        </View>
        {point.comment ? (
          <Text style={styles.comment} numberOfLines={1}>{point.comment}</Text>
        ) : null}
        {(point as any).address ? (
          <Text style={styles.address} numberOfLines={1}>📍 {(point as any).address}</Text>
        ) : null}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  noteBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  partner: {
    color: '#e91e8c',
    fontSize: 12,
    fontWeight: '600',
  },
  comment: {
    color: '#888888',
    fontSize: 13,
    marginTop: 2,
  },
  address: {
    color: '#666666',
    fontSize: 11,
    marginTop: 2,
  },
  chevron: {
    color: '#555',
    fontSize: 22,
    fontWeight: '300',
  },
});

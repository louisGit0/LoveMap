import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Marker } from 'react-native-maps';
import { router } from 'expo-router';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
  isOwner?: boolean;
  onDelete?: (pointId: string) => void;
}

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Il y a 1 jour';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  return `Il y a ${Math.floor(diffDays / 30)} mois`;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function Stars({ note }: { note: number }) {
  return (
    <Text style={styles.stars}>
      {'★'.repeat(note)}{'☆'.repeat(10 - note)}
    </Text>
  );
}

export function PointMarker({ point, isOwner = false, onDelete }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const color = noteColor(point.note);

  return (
    <>
      <Marker
        coordinate={{ latitude: point.latitude, longitude: point.longitude }}
        onPress={() => setModalVisible(true)}
        pinColor={color}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <Stars note={point.note} />
          <Text style={styles.noteLabel}>{point.note}/10</Text>

          {point.comment ? (
            <Text style={styles.comment} numberOfLines={3}>
              {point.comment.length > 100 ? point.comment.slice(0, 100) + '…' : point.comment}
            </Text>
          ) : null}

          <View style={styles.meta}>
            {point.duration_minutes ? (
              <Text style={styles.metaText}>⏱ {formatDuration(point.duration_minutes)}</Text>
            ) : null}
            <Text style={styles.metaText}>📅 {formatDate(point.created_at)}</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setModalVisible(false);
                router.push(`/(app)/point/${point.id}`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>Voir le détail</Text>
            </TouchableOpacity>

            {isOwner && onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  setModalVisible(false);
                  onDelete(point.id);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  stars: {
    fontSize: 20,
    color: '#e91e8c',
    textAlign: 'center',
    letterSpacing: 2,
  },
  noteLabel: {
    color: '#888888',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 12,
  },
  comment: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 20,
  },
  metaText: {
    color: '#888888',
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#e91e8c',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});

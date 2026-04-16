import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { MapPoint } from '@/types/app.types';
import type { ConsentStatus } from '@/types/database.types';

interface Props {
  point: MapPoint;
  consentStatus?: ConsentStatus | null;
  onPress: () => void;
}

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Il y a 1 jour';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine(s)`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an(s)`;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

interface ConsentBadgeProps {
  status: ConsentStatus | null | undefined;
}

function ConsentBadge({ status }: ConsentBadgeProps) {
  if (!status) {
    return (
      <View style={[styles.badge, styles.badgeGray]}>
        <Text style={styles.badgeText}>Sans partenaire</Text>
      </View>
    );
  }
  if (status === 'pending') {
    return (
      <View style={[styles.badge, styles.badgeOrange]}>
        <Text style={styles.badgeText}>⏳ En attente</Text>
      </View>
    );
  }
  if (status === 'accepted') {
    return (
      <View style={[styles.badge, styles.badgeGreen]}>
        <Text style={styles.badgeText}>✓ Approuvé</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeRed]}>
      <Text style={styles.badgeText}>✕ Refusé</Text>
    </View>
  );
}

export function PointCard({ point, consentStatus, onPress }: Props) {
  const color = noteColor(point.note);
  const duration = formatDuration(point.duration_minutes);
  const relativeDate = useMemo(() => formatRelativeDate(point.created_at), [point.created_at]);
  const truncatedComment = point.comment
    ? point.comment.length > 80
      ? point.comment.slice(0, 80) + '…'
      : point.comment
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* En-tête : note + badge */}
      <View style={styles.header}>
        <View style={styles.noteContainer}>
          <Text style={[styles.noteValue, { color }]}>{point.note}</Text>
          <Text style={styles.noteMax}>/10</Text>
        </View>
        <View style={styles.starsRow}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Text key={n} style={[styles.star, { color: n <= point.note ? color : '#2a2a2a' }]}>
              ★
            </Text>
          ))}
        </View>
        <ConsentBadge status={consentStatus} />
      </View>

      {/* Commentaire */}
      {truncatedComment && (
        <Text style={styles.comment}>{truncatedComment}</Text>
      )}

      {/* Meta : durée + date */}
      <View style={styles.meta}>
        {duration && (
          <Text style={styles.metaText}>⏱ {duration}</Text>
        )}
        <Text style={styles.metaText}>📅 {relativeDate}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 14,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  noteValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  noteMax: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '400',
  },
  starsRow: {
    flexDirection: 'row',
    flex: 1,
  },
  star: {
    fontSize: 10,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  badgeOrange: {
    backgroundColor: '#ff980033',
    borderWidth: 1,
    borderColor: '#ff980066',
  },
  badgeGreen: {
    backgroundColor: '#4caf5033',
    borderWidth: 1,
    borderColor: '#4caf5066',
  },
  badgeRed: {
    backgroundColor: '#f4433633',
    borderWidth: 1,
    borderColor: '#f4433666',
  },
  badgeGray: {
    backgroundColor: '#33333333',
    borderWidth: 1,
    borderColor: '#55555566',
  },
  comment: {
    color: '#cccccc',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    gap: 14,
  },
  metaText: {
    color: '#888888',
    fontSize: 12,
  },
});

import React, { useState, useMemo } from 'react';
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
import Svg, { Circle, Line } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import { IcoTrash } from '@/components/icons';
import type { Theme } from '@/constants/theme';
import type { MapPoint } from '@/types/app.types';

interface Props {
  point: MapPoint;
  isOwner?: boolean;
  onDelete?: (pointId: string) => void;
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function formatDateRelative(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return 'Il y a 1 jour';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

/** Pin SVG : cercle extérieur + cercle intérieur + tige + point bas */
function PinIcon({ T }: { T: Theme }) {
  const size = 40;
  const cx = size / 2;
  const stemTop = size * 0.72;
  const stemBottom = size - 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Tige */}
      <Line x1={cx} y1={stemTop} x2={cx} y2={stemBottom} stroke={T.primary} strokeWidth="1.5" />
      {/* Point bas */}
      <Circle cx={cx} cy={stemBottom} r="1.5" fill={T.primary} />
      {/* Cercle extérieur */}
      <Circle cx={cx} cy={cx * 0.82} r={cx * 0.7} fill={T.bg} stroke={T.primary} strokeWidth="1.5" />
      {/* Cercle intérieur */}
      <Circle cx={cx} cy={cx * 0.82} r={cx * 0.38} fill={T.primary} />
    </Svg>
  );
}

export function PointMarker({ point, isOwner = false, onDelete }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Marker
        coordinate={{ latitude: point.latitude, longitude: point.longitude }}
        onPress={() => setModalVisible(true)}
        anchor={{ x: 0.5, y: 1 }}
      >
        <PinIcon T={T} />
      </Marker>

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
          {/* Poignée */}
          <View style={styles.handle} />

          {/* Note */}
          <View style={styles.noteRow}>
            <Text style={styles.noteValue}>{point.note}</Text>
            <Text style={styles.noteDenom}>/10</Text>
          </View>

          {/* Barre note */}
          <View style={styles.noteBar}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <View key={n} style={[styles.noteSegment, n <= point.note && styles.noteSegmentActive]} />
            ))}
          </View>

          {/* Partenaire */}
          {point.partnerUsername && (
            <Text style={styles.partnerTag}>avec @{point.partnerUsername}</Text>
          )}

          {/* Commentaire avec guillemets */}
          {point.comment ? (
            <View style={styles.quoteBlock}>
              <Text style={styles.quoteMark}>«</Text>
              <Text style={styles.quoteText} numberOfLines={3}>
                {point.comment.length > 120 ? point.comment.slice(0, 120) + '…' : point.comment}
              </Text>
              <Text style={[styles.quoteMark, styles.quoteMarkRight]}>»</Text>
            </View>
          ) : null}

          {/* Méta */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{formatDateRelative(point.created_at)}</Text>
            {point.duration_minutes ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaText}>{formatDuration(point.duration_minutes)}</Text>
              </>
            ) : null}
            {(point as any).address ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.metaText} numberOfLines={1}>{(point as any).address}</Text>
              </>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => { setModalVisible(false); router.push(`/(app)/point/${point.id}`); }}
              activeOpacity={0.88}
            >
              <View style={styles.detailBtnLeft}>
                <Text style={styles.detailBtnEyebrow}>Page</Text>
                <Text style={styles.detailBtnLabel}>Voir le détail</Text>
              </View>
            </TouchableOpacity>

            {isOwner && onDelete && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => { setModalVisible(false); onDelete(point.id); }}
                activeOpacity={0.8}
              >
                <IcoTrash size={18} color={T.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: T.surface,
    borderTopWidth: 1,
    borderTopColor: T.border,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 32,
    height: 2,
    backgroundColor: T.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  noteValue: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 56,
    lineHeight: 52,
    color: T.primary,
    letterSpacing: -2,
  },
  noteDenom: {
    fontFamily: F.mono,
    fontSize: 14,
    color: T.textFaint,
    marginLeft: 4,
    marginBottom: 8,
  },
  noteBar: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 16,
  },
  noteSegment: {
    flex: 1,
    height: 3,
    backgroundColor: T.surface2,
  },
  noteSegmentActive: {
    backgroundColor: T.primary,
  },
  partnerTag: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 12,
  },
  quoteBlock: {
    marginBottom: 16,
  },
  quoteMark: {
    fontFamily: F.serifMedium,
    fontSize: 24,
    color: T.primary,
    lineHeight: 20,
  },
  quoteMarkRight: { textAlign: 'right' },
  quoteText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    lineHeight: 26,
    color: T.text,
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  metaSep: {
    color: T.border,
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBtn: {
    flex: 1,
    height: 52,
    backgroundColor: T.primary,
  },
  detailBtnLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 1,
  },
  detailBtnEyebrow: {
    fontFamily: F.mono,
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.text,
    opacity: 0.7,
  },
  detailBtnLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.text,
  },
  deleteBtn: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

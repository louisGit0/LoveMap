import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { router } from 'expo-router';
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

/**
 * Pin View sans SVG — compatible PointAnnotation (rendu natif Mapbox, snapshot RN view).
 * Pin au repos raffiné (D-05) : tête 24, point intérieur 9, tige 8, point bas 4,
 * halo statique léger (capturé dans le snapshot, pas une transform animée).
 */
function PinIcon({ T }: { T: Theme }) {
  return (
    <View style={{ width: 28, height: 36, alignItems: 'center' }}>
      {/* Tête */}
      <View style={{
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: T.bg,
        borderWidth: 2,
        borderColor: T.primary,
        alignItems: 'center',
        justifyContent: 'center',
        // Halo statique léger — figé dans le snapshot natif (pas d'animation)
        shadowColor: T.primary,
        shadowRadius: 6,
        shadowOpacity: 0.5,
        shadowOffset: { width: 0, height: 0 },
      }}>
        <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: T.primary }} />
      </View>
      {/* Tige */}
      <View style={{ width: 2, height: 8, backgroundColor: T.primary }} />
      {/* Point bas */}
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.primary }} />
    </View>
  );
}

/**
 * Variante sélectionnée (D-06) : tête agrandie (~×1.25) + anneau halo rose derrière.
 * Rendue par RE-SNAPSHOT (toggle de variante + refresh()), JAMAIS par une transform
 * animée sur les enfants de PointAnnotation (le snapshot natif gèlerait l'animation).
 */
function PinIconSelected({ T }: { T: Theme }) {
  return (
    <View style={{ width: 44, height: 56, alignItems: 'center' }}>
      {/* Anneau halo + tête agrandie */}
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,45,135,0.12)',
        borderWidth: 1,
        borderColor: 'rgba(255,45,135,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <View style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: T.bg,
          borderWidth: 2,
          borderColor: T.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: T.primary }} />
        </View>
      </View>
      {/* Tige */}
      <View style={{ width: 2, height: 8, backgroundColor: T.primary }} />
      {/* Point bas */}
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: T.primary }} />
    </View>
  );
}

export function PointMarker({ point, isOwner = false, onDelete }: Props) {
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected] = useState(false);
  const annRef = useRef<MapboxGL.PointAnnotation>(null);

  // Sélection = re-snapshot (Pitfall 2) : refresh() obligatoire après le swap de variante.
  // Sans refresh(), un simple changement d'état React ne re-déclenche pas toujours le snapshot natif.
  useEffect(() => {
    annRef.current?.refresh();
  }, [selected]);

  return (
    <>
      {/*
       * PointAnnotation (annotation native Mapbox) — toujours visible quel que soit le zoom.
       * MarkerView était une overlay RN qui disparaissait lors du re-rendu des tiles (régression).
       * Sélection : swap de variante (PinIcon ↔ PinIconSelected) + refresh() — PAS de transform
       * animée sur les enfants (le snapshot natif la gèlerait → no-op).
       */}
      <MapboxGL.PointAnnotation
        ref={annRef}
        id={point.id}
        coordinate={[point.longitude, point.latitude]}
        anchor={{ x: 0.5, y: 1 }}
        selected={selected}
        onSelected={() => { setSelected(true); setModalVisible(true); }}
        onDeselected={() => setSelected(false)}
      >
        {selected ? <PinIconSelected T={T} /> : <PinIcon T={T} />}
      </MapboxGL.PointAnnotation>

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

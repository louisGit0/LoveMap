import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { DatePickerModal } from 'react-native-paper-dates';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoArrow, IcoTrash } from '@/components/icons';
import type { MapPoint, Profile, PointPartner } from '@/types/app.types';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function consentLabel(status: string): string {
  if (status === 'pending') return 'En attente';
  if (status === 'accepted') return 'Accepté';
  return 'Refusé';
}

export default function PointDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { deletePoint, updatePointFields } = usePoints();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [point, setPoint] = useState<MapPoint | null>(null);
  const [partnerRecord, setPartnerRecord] = useState<PointPartner | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<{ id: string; photo_url: string; position: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(5);
  const [editDuration, setEditDuration] = useState('');
  const [editComment, setEditComment] = useState('');
  const [editDate, setEditDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadPoint();
  }, [id]);

  async function loadPoint() {
    setLoading(true);
    const { data: raw } = await supabase.from('points').select('*').eq('id', id).single();
    if (raw) {
      const coords = (raw.location as any)?.coordinates ?? [0, 0];
      setPoint({ ...raw, longitude: coords[0], latitude: coords[1] });
    }
    const { data: pp } = await supabase.from('point_partners').select('*').eq('point_id', id).maybeSingle();
    if (pp) {
      setPartnerRecord(pp);
      const { data: profile } = await supabase
        .from('profiles').select('id, username, display_name, avatar_url').eq('id', pp.partner_id).single();
      setPartnerProfile(profile as Profile);
    }
    const { data: photoData } = await supabase
      .from('point_photos').select('id, photo_url, position').eq('point_id', id).order('position');
    setPhotos(photoData ?? []);
    setLoading(false);
  }

  async function handleDelete() {
    if (!point) return;
    Alert.alert('Effacer cette page', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: async () => {
          const ok = await deletePoint(point.id);
          if (ok) router.replace('/(app)/map');
          else setSnackbar('Erreur lors de la suppression.');
        },
      },
    ]);
  }

  function enterEditMode() {
    if (!point) return;
    setEditNote(point.note);
    setEditDuration(point.duration_minutes?.toString() ?? '');
    setEditComment(point.comment ?? '');
    setEditDate(point.happened_at ? new Date(point.happened_at) : new Date(point.created_at));
    setEditing(true);
  }

  async function handleSaveAndAccept() {
    if (!point || !partnerRecord) return;
    setSaving(true);
    const ok = await updatePointFields(point.id, {
      note: editNote,
      comment: editComment.trim() || null,
      duration_minutes: editDuration ? parseInt(editDuration, 10) : null,
      happened_at: new Date(editDate.getFullYear(), editDate.getMonth(), editDate.getDate(), 12, 0, 0).toISOString(),
    });
    if (!ok) { setSnackbar('Erreur lors de la sauvegarde.'); setSaving(false); return; }
    await handleConsent(true);
    setEditing(false);
    setSaving(false);
  }

  async function handleConsent(accept: boolean) {
    if (!partnerRecord) return;
    const { error } = await supabase.from('point_partners').update({
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString(),
    }).eq('id', partnerRecord.id);
    if (error) { setSnackbar('Erreur lors de la réponse.'); return; }
    setSnackbar(accept ? 'Page scellée.' : 'Taguage refusé.');
    await loadPoint();
  }

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  if (!point) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Page introuvable.</Text>
      </View>
    );
  }

  const isOwner = point.creator_id === user?.id;
  const isPartner = partnerRecord?.partner_id === user?.id;
  const isPending = partnerRecord?.status === 'pending';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mini carte */}
        <View style={styles.miniMap}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{ latitude: point.latitude, longitude: point.longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
            scrollEnabled={false}
            zoomEnabled={false}
            customMapStyle={darkMapStyle}
            pointerEvents="none"
          >
            <Marker coordinate={{ latitude: point.latitude, longitude: point.longitude }} pinColor={T.primary} />
          </MapView>

          {/* Bouton retour flottant */}
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 12 }]} onPress={() => router.back()} activeOpacity={0.8}>
            <IcoArrow size={16} color={T.text} dir="left" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Note grande */}
          <View style={styles.noteBlock}>
            <Text style={styles.noteValue}>{point.note}</Text>
            <Text style={styles.noteDenom}>/10</Text>
          </View>

          {/* Barre segments note */}
          <View style={styles.noteBar}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <View key={n} style={[styles.noteSegment, n <= point.note && styles.noteSegmentActive]} />
            ))}
          </View>

          {/* Commentaire editorial */}
          {point.comment ? (
            <View style={styles.quoteBlock}>
              <Text style={styles.quoteMark}>«</Text>
              <Text style={styles.quoteText}>{point.comment}</Text>
              <Text style={[styles.quoteMark, styles.quoteMarkRight]}>»</Text>
            </View>
          ) : null}

          {/* Photos */}
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
              {photos.map((photo) => (
                <Image key={photo.id} source={{ uri: photo.photo_url }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          )}

          {/* Table métadonnées */}
          <View style={styles.metaTable}>
            {(point as any).address && (
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Lieu</Text>
                <Text style={styles.metaValue} numberOfLines={2}>{(point as any).address}</Text>
              </View>
            )}
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(point.happened_at ?? point.created_at)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaKey}>Durée</Text>
              <Text style={styles.metaValue}>{formatDuration(point.duration_minutes)}</Text>
            </View>
            {partnerProfile && partnerRecord && (
              <View style={styles.metaRow}>
                <Text style={styles.metaKey}>Avec</Text>
                <View style={styles.metaPartner}>
                  <Text style={styles.metaValue}>{partnerProfile.display_name ?? partnerProfile.username}</Text>
                  <View style={[styles.consentBadge, partnerRecord.status === 'accepted' && styles.consentBadgeOk, partnerRecord.status === 'rejected' && styles.consentBadgeNo]}>
                    <Text style={styles.consentBadgeText}>{consentLabel(partnerRecord.status)}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Consentement partenaire */}
          {isPartner && isPending && !editing && (
            <View style={styles.consentBlock}>
              <Text style={styles.consentQuestion}>Ce moment vous concerne.{'\n'}Acceptez-vous d'y figurer ?</Text>
              <View style={styles.consentActions}>
                <TouchableOpacity style={styles.consentEditBtn} onPress={enterEditMode} activeOpacity={0.8}>
                  <Text style={styles.consentEditText}>Modifier</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.consentAcceptBtn} onPress={() => handleConsent(true)} activeOpacity={0.88}>
                  <Text style={styles.consentAcceptText}>Sceller</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.consentRejectBtn} onPress={() => handleConsent(false)} activeOpacity={0.7}>
                <Text style={styles.consentRejectText}>Refuser ce taguage</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Formulaire édition partenaire */}
          {editing && (
            <View style={styles.editBlock}>
              <Text style={styles.editEyebrow}>Modifier le moment</Text>

              <Text style={styles.editLabel}>Note</Text>
              <View style={styles.editNoteRow}>
                <Text style={styles.editNoteValue}>{editNote}</Text>
                <Text style={styles.editNoteDenom}>/10</Text>
              </View>
              <View style={styles.noteSegments}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity key={n} onPress={() => setEditNote(n)} style={[styles.noteSegment, n <= editNote && styles.noteSegmentActive]} />
                ))}
              </View>

              <Text style={[styles.editLabel, { marginTop: 20 }]}>Durée (minutes)</Text>
              <TextInput
                style={styles.editLineInput}
                value={editDuration}
                onChangeText={(v) => setEditDuration(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={T.textFaint}
              />

              <Text style={[styles.editLabel, { marginTop: 20 }]}>Date</Text>
              <TouchableOpacity style={styles.editDateBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.7}>
                <Text style={styles.editDateText}>
                  {editDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                locale="fr"
                mode="single"
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                date={editDate}
                onConfirm={({ date: picked }) => { setShowDatePicker(false); if (picked) setEditDate(picked); }}
                validRange={{ endDate: new Date() }}
                label="Choisir une date"
                saveLabel="Confirmer"
              />

              <Text style={[styles.editLabel, { marginTop: 20 }]}>Commentaire</Text>
              <TextInput
                style={styles.editCommentInput}
                value={editComment}
                onChangeText={(v) => v.length <= 500 && setEditComment(v)}
                multiline
                numberOfLines={3}
                placeholder="Commentaire..."
                placeholderTextColor={T.textFaint}
                maxLength={500}
              />
              <Text style={styles.charCount}>{editComment.length}/500</Text>

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSaveAndAccept}
                disabled={saving}
                activeOpacity={0.88}
              >
                <View style={styles.saveBtnLeft}>
                  <Text style={styles.saveBtnLabel}>{saving ? 'Scellement...' : 'Sauvegarder et sceller'}</Text>
                </View>
                <View style={styles.saveBtnArrow}>
                  <IcoArrow size={18} color={T.primary} dir="right" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelEditBtn} onPress={() => setEditing(false)} activeOpacity={0.7}>
                <Text style={styles.cancelEditText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action propriétaire */}
          {isOwner && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <IcoTrash size={16} color={T.primary} />
              <Text style={styles.deleteBtnText}>Effacer cette page</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  centered: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: T.primary },
  miniMap: { height: 220, backgroundColor: T.surface },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: T.bg + 'cc',
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 24 },
  noteBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  noteValue: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 80,
    lineHeight: 80,
    color: T.primary,
    letterSpacing: -3,
  },
  noteDenom: {
    fontFamily: F.mono,
    fontSize: 18,
    color: T.textFaint,
    marginLeft: 4,
    marginBottom: 10,
  },
  noteBar: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 28,
  },
  noteSegment: {
    flex: 1,
    height: 4,
    backgroundColor: T.surface2,
  },
  noteSegmentActive: {
    backgroundColor: T.primary,
  },
  quoteBlock: {
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  quoteMark: {
    fontFamily: F.serifMedium,
    fontSize: 32,
    color: T.primary,
    lineHeight: 28,
  },
  quoteMarkRight: {
    textAlign: 'right',
  },
  quoteText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 30,
    color: T.text,
    marginVertical: 4,
  },
  photosRow: { marginBottom: 24 },
  photoThumb: {
    width: 120,
    height: 120,
    marginRight: 8,
    backgroundColor: T.surface,
  },
  metaTable: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    marginBottom: 28,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 12,
  },
  metaKey: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
    paddingTop: 2,
    width: 48,
  },
  metaValue: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 16,
    color: T.text,
    flex: 1,
    textAlign: 'right',
  },
  metaPartner: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  consentBadge: {
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  consentBadgeOk: {
    borderColor: T.primary,
  },
  consentBadgeNo: {
    borderColor: T.textFaint,
    opacity: 0.6,
  },
  consentBadgeText: {
    fontFamily: F.mono,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  consentBlock: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 24,
    marginBottom: 24,
  },
  consentQuestion: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 28,
    color: T.text,
    marginBottom: 20,
  },
  consentActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  consentEditBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  consentEditText: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: T.textDim,
  },
  consentAcceptBtn: {
    flex: 2,
    backgroundColor: T.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  consentAcceptText: {
    fontFamily: F.sansMedium,
    fontSize: 14,
    letterSpacing: 0.5,
    color: T.text,
  },
  consentRejectBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  consentRejectText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.textFaint,
    textDecorationLine: 'underline',
  },
  editBlock: {
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 24,
    marginBottom: 24,
  },
  editEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 16,
  },
  editLabel: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 8,
  },
  editNoteRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  editNoteValue: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 48,
    lineHeight: 48,
    color: T.primary,
  },
  editNoteDenom: {
    fontFamily: F.mono,
    fontSize: 14,
    color: T.textFaint,
    marginLeft: 4,
  },
  noteSegments: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 8,
  },
  editLineInput: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.text,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 8,
  },
  editDateBtn: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 8,
  },
  editDateText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
  },
  editCommentInput: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 17,
    color: T.text,
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 0,
    lineHeight: 24,
  },
  charCount: {
    fontFamily: F.mono,
    fontSize: 9,
    color: T.textFaint,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    height: 56,
    marginTop: 8,
  },
  saveBtnLeft: {
    flex: 1,
    backgroundColor: T.primary,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  saveBtnLabel: {
    fontFamily: F.sansMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: T.text,
  },
  saveBtnArrow: {
    width: 56,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelEditBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelEditText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.textFaint,
    textDecorationLine: 'underline',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: T.border,
    paddingTop: 20,
    marginTop: 8,
  },
  deleteBtnText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.primary,
    textDecorationLine: 'underline',
  },
  snackbar: { backgroundColor: T.surface2 },
});

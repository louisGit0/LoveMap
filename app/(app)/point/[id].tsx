import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePreventRemove, useNavigation } from '@react-navigation/native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { haptics } from '@/lib/haptics';
import { mapboxStaticUrl } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoArrow, IcoTrash } from '@/components/icons';
import type { MapPoint, Profile, PointPartner } from '@/types/app.types';


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
  const navigation = useNavigation();
  const { user } = useAuth();
  const { deletePoint, updatePointFields } = usePoints();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

  const [point, setPoint] = useState<MapPoint | null>(null);
  const [partners, setPartners] = useState<{ record: PointPartner; profile: Profile | null }[]>([]);
  const [photos, setPhotos] = useState<{ id: string; photo_url: string; position: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [editNote, setEditNote] = useState(5);
  const [editDuration, setEditDuration] = useState('');
  const [editComment, setEditComment] = useState('');
  const [dayStr, setDayStr] = useState('');
  const [monthStr, setMonthStr] = useState('');
  const [yearStr, setYearStr] = useState('');
  const [saving, setSaving] = useState(false);

  // Ma ligne de partenaire (si je fais partie des partenaires mentionnés) — pour le consentement.
  const myPartner = partners.find((p) => p.record.partner_id === user?.id)?.record ?? null;

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
    const { data: pps } = await supabase
      .from('point_partners')
      .select('*, profiles:partner_id(id, username, display_name, avatar_url)')
      .eq('point_id', id);
    setPartners((pps ?? []).map((pp: any) => ({
      record: pp as PointPartner,
      profile: (pp.profiles ?? null) as Profile | null,
    })));
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
          if (ok) { haptics.warn(); router.replace('/(app)/map'); }
          else { haptics.error(); setSnackbar('Erreur lors de la suppression.'); }
        },
      },
    ]);
  }

  function enterEditMode() {
    if (!point) return;
    setEditNote(point.note);
    setEditDuration(point.duration_minutes?.toString() ?? '');
    setEditComment(point.comment ?? '');
    const d = point.happened_at ? new Date(point.happened_at) : new Date(point.created_at);
    setDayStr(String(d.getDate()).padStart(2, '0'));
    setMonthStr(String(d.getMonth() + 1).padStart(2, '0'));
    setYearStr(String(d.getFullYear()));
    setEditing(true);
  }

  async function handleSaveAndAccept() {
    if (!point || !myPartner) return;
    setSaving(true);
    const d = parseInt(dayStr, 10);
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);
    const parsed = new Date(y, m - 1, d, 12, 0, 0);
    const happenedAt = !isNaN(parsed.getTime())
      ? parsed.toISOString()
      : new Date(point.happened_at ?? point.created_at).toISOString();
    const ok = await updatePointFields(point.id, {
      note: editNote,
      comment: editComment.trim() || null,
      duration_minutes: editDuration ? parseInt(editDuration, 10) : null,
      happened_at: happenedAt,
    });
    if (!ok) { setSnackbar('Erreur lors de la sauvegarde.'); setSaving(false); return; }
    await handleConsent(true);
    setEditing(false);
    setSaving(false);
  }

  async function handleConsent(accept: boolean) {
    if (!myPartner) return;
    const { error } = await supabase.from('point_partners').update({
      status: accept ? 'accepted' : 'rejected',
      responded_at: new Date().toISOString(),
    }).eq('id', myPartner.id);
    if (error) { haptics.error(); setSnackbar('Erreur lors de la réponse.'); return; }
    if (accept) haptics.success(); else haptics.warn();
    setSnackbar(accept ? 'Page scellée.' : 'Taguage refusé.');
    await loadPoint();
  }

  // D-04 — garde de fermeture en mode édition : confirmation si la saisie est modifiée.
  // La date est désormais en segments (pas de Modal) → aucun risque de gel #2125,
  // la garde n'a pas besoin d'être conditionnée à un picker ouvert.
  const originalDate = point ? new Date(point.happened_at ?? point.created_at) : null;
  const originalDay = originalDate ? String(originalDate.getDate()).padStart(2, '0') : '';
  const originalMonth = originalDate ? String(originalDate.getMonth() + 1).padStart(2, '0') : '';
  const originalYear = originalDate ? String(originalDate.getFullYear()) : '';
  const isEditDirty =
    editing &&
    point != null &&
    (editNote !== point.note ||
      editComment !== (point.comment ?? '') ||
      editDuration !== (point.duration_minutes?.toString() ?? '') ||
      dayStr !== originalDay ||
      monthStr !== originalMonth ||
      yearStr !== originalYear);

  usePreventRemove(isEditDirty, ({ data }) => {
    haptics.warn();
    Alert.alert(
      'Abandonner ce moment ?',
      'Votre saisie ne sera pas enregistrée.',
      [
        { text: "Continuer l'écriture", style: 'cancel' },
        { text: 'Abandonner', style: 'destructive', onPress: () => navigation.dispatch(data.action) },
      ]
    );
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={T.primary} size="large" />
      </View>
    );
  }

  if (!point) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Page introuvable. Faites glisser vers le bas pour fermer.</Text>
      </View>
    );
  }

  const isOwner = point.creator_id === user?.id;
  const isPartner = !!myPartner;
  const isPending = myPartner?.status === 'pending';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      >
        {/* Aperçu carte STATIQUE (Mapbox Static Images via <Image>) — fiable dans un
            `modal` (cf. règle 19 ; un MapView GL resterait risqué). Pin rose en RN. */}
        <View style={styles.miniMap}>
          <Image
            source={{ uri: mapboxStaticUrl(point.longitude, point.latitude) }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
          <View style={styles.miniMapPinWrap} pointerEvents="none">
            <View style={styles.markerDot} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Eyebrow de page — lecture */}
          <Text style={styles.pageEyebrow}>La page</Text>

          {/* Note grande — hero de lecture (Display 80) */}
          <View style={styles.noteBlock}>
            <Text style={styles.noteValue} maxFontSizeMultiplier={1.15}>{point.note}</Text>
            <Text style={styles.noteDenom}>/10</Text>
          </View>

          {/* Barre segments note */}
          <View style={styles.noteBar}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <View key={n} style={[styles.noteSegment, n <= point.note && styles.noteSegmentActive]} />
            ))}
          </View>

          {/* Avec — partenaires mentionnés, mis en avant sous la note (photo + nom + statut) */}
          {partners.length > 0 && (
            <View style={styles.withBlock}>
              <Text style={styles.withEyebrow}>Avec</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.withRow}>
                {partners.map((p) => {
                  const name = p.profile?.display_name ?? p.profile?.username ?? '—';
                  return (
                    <View key={p.record.id} style={styles.withCard}>
                      <View style={styles.withAvatar}>
                        {p.profile?.avatar_url ? (
                          <Image source={{ uri: p.profile.avatar_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                        ) : (
                          <Text style={styles.withAvatarInitial}>{name[0]?.toUpperCase() ?? '?'}</Text>
                        )}
                      </View>
                      <Text style={styles.withName} numberOfLines={1}>{name}</Text>
                      <View style={[styles.consentBadge, p.record.status === 'accepted' && styles.consentBadgeOk, p.record.status === 'rejected' && styles.consentBadgeNo]}>
                        <Text style={styles.consentBadgeText}>{consentLabel(p.record.status)}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          )}

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
              <View style={styles.dateRow}>
                <TextInput
                  style={styles.dateSegment}
                  value={dayStr}
                  onChangeText={(v) => setDayStr(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="JJ"
                  placeholderTextColor={T.textFaint}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                  style={styles.dateSegment}
                  value={monthStr}
                  onChangeText={(v) => setMonthStr(v.replace(/[^0-9]/g, '').slice(0, 2))}
                  keyboardType="numeric"
                  maxLength={2}
                  placeholder="MM"
                  placeholderTextColor={T.textFaint}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                  style={[styles.dateSegment, styles.dateSegmentYear]}
                  value={yearStr}
                  onChangeText={(v) => setYearStr(v.replace(/[^0-9]/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  maxLength={4}
                  placeholder="AAAA"
                  placeholderTextColor={T.textFaint}
                />
              </View>

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
                <Text style={styles.cancelEditText}>Annuler les modifications</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action propriétaire */}
          {isOwner && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
              <IcoTrash size={16} color={T.danger} />
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
  scroll: { flex: 1 },
  centered: { flex: 1, backgroundColor: T.bg, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontFamily: F.serif, fontStyle: 'italic', fontSize: 16, color: T.text, textAlign: 'center', paddingHorizontal: 32 },
  miniMap: {
    height: 220,
    backgroundColor: T.surface,
    overflow: 'hidden',
    borderRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  pageEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 16,
  },
  miniMapPinWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.primary,
    borderWidth: 2,
    borderColor: T.bg,
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
    lineHeight: 76,
    color: T.primary,
    letterSpacing: -3,
  },
  noteDenom: {
    fontFamily: F.mono,
    fontSize: 16,
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
    fontFamily: F.serif,
    fontStyle: 'italic',
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
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
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
  // Bloc « Avec » proéminent (sous la note) — partenaires mentionnés en cartes photo
  withBlock: {
    marginTop: 24,
    marginBottom: 8,
  },
  withEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 12,
  },
  withRow: {
    flexDirection: 'row',
    gap: 16,
    paddingRight: 4,
  },
  withCard: {
    alignItems: 'center',
    gap: 8,
    width: 76,
  },
  withAvatar: {
    width: 56,
    height: 56,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  withAvatarInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 26,
    color: T.primary,
  },
  withName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 18,
    color: T.text,
    textAlign: 'center',
  },
  consentBadge: {
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: T.radiusXs,
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
    fontSize: 9,
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
    justifyContent: 'center',
    borderRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  consentEditText: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textDim,
  },
  consentAcceptBtn: {
    flex: 2,
    backgroundColor: T.primary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  consentAcceptText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 26,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  dateSegment: {
    fontFamily: F.mono,
    fontSize: 20,
    letterSpacing: -1,
    color: T.text,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 4,
    textAlign: 'center',
    width: 52,
  },
  dateSegmentYear: {
    width: 80,
  },
  dateSep: {
    fontFamily: F.mono,
    fontSize: 20,
    color: T.textFaint,
    marginBottom: 4,
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
    borderTopLeftRadius: T.radiusMd,
    borderBottomLeftRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  saveBtnLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 26,
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
    borderTopRightRadius: T.radiusMd,
    borderBottomRightRadius: T.radiusMd,
    borderCurve: 'continuous',
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
    color: T.danger,
    textDecorationLine: 'underline',
  },
  snackbar: { backgroundColor: T.surface2 },
});

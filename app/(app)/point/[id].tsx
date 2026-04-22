import React, { useEffect, useState } from 'react';
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
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import type { MapPoint, Profile, PointPartner } from '@/types/app.types';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
];

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

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
  if (status === 'pending') return '⏳ En attente';
  if (status === 'accepted') return '✅ Accepté';
  return '❌ Refusé';
}

export default function PointDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { deletePoint, updatePointFields } = usePoints();

  const [point, setPoint] = useState<MapPoint | null>(null);
  const [partnerRecord, setPartnerRecord] = useState<PointPartner | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<{ id: string; photo_url: string; position: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Mode édition partenaire
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

    const { data: raw } = await supabase
      .from('points')
      .select('*')
      .eq('id', id)
      .single();

    if (raw) {
      const coords = (raw.location as any)?.coordinates ?? [0, 0];
      setPoint({ ...raw, longitude: coords[0], latitude: coords[1] });
    }

    // Charger partenaire
    const { data: pp } = await supabase
      .from('point_partners')
      .select('*')
      .eq('point_id', id)
      .maybeSingle();

    if (pp) {
      setPartnerRecord(pp);
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', pp.partner_id)
        .single();
      setPartnerProfile(profile as Profile);
    }

    // Charger photos
    const { data: photoData } = await supabase
      .from('point_photos')
      .select('id, photo_url, position')
      .eq('point_id', id)
      .order('position');
    setPhotos(photoData ?? []);

    setLoading(false);
  }

  async function handleDelete() {
    if (!point) return;
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce point ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
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
    if (!ok) {
      setSnackbar('Erreur lors de la sauvegarde.');
      setSaving(false);
      return;
    }
    await handleConsent(true);
    setEditing(false);
    setSaving(false);
  }

  async function handleConsent(accept: boolean) {
    if (!partnerRecord) return;
    const { error } = await supabase
      .from('point_partners')
      .update({
        status: accept ? 'accepted' : 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('id', partnerRecord.id);

    if (error) {
      setSnackbar('Erreur lors de la réponse.');
      return;
    }
    setSnackbar(accept ? 'Taguage accepté !' : 'Taguage refusé.');
    await loadPoint();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e91e8c" size="large" />
      </View>
    );
  }

  if (!point) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Point introuvable.</Text>
      </View>
    );
  }

  const isOwner = point.creator_id === user?.id;
  const isPartner = partnerRecord?.partner_id === user?.id;
  const isPending = partnerRecord?.status === 'pending';
  const color = noteColor(point.note);

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Mini carte */}
        <View style={styles.miniMap}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: point.latitude,
              longitude: point.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            customMapStyle={darkMapStyle}
            pointerEvents="none"
          >
            <Marker
              coordinate={{ latitude: point.latitude, longitude: point.longitude }}
              pinColor={color}
            />
          </MapView>
        </View>

        <View style={styles.content}>
          {/* Partenaire badge */}
          {partnerProfile && (
            <View style={styles.partnerBadge}>
              <Text style={styles.partnerBadgeText}>
                avec @{partnerProfile.username}
              </Text>
            </View>
          )}

          {/* Note */}
          <View style={styles.noteContainer}>
            <Text style={[styles.noteValue, { color }]}>{point.note}/10</Text>
            <Text style={styles.stars}>
              {'★'.repeat(point.note)}{'☆'.repeat(10 - point.note)}
            </Text>
          </View>

          {/* Photos */}
          {photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
              {photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.photo_url }}
                  style={styles.photoThumb}
                />
              ))}
            </ScrollView>
          )}

          {/* Détails */}
          <View style={styles.card}>
            {(point as any).address && (
              <>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>Adresse</Text>
                  <Text style={[styles.rowValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {(point as any).address}
                  </Text>
                </View>
                <View style={styles.separator} />
              </>
            )}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date</Text>
              <Text style={styles.rowValue}>{formatDate(point.happened_at ?? point.created_at)}</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Durée</Text>
              <Text style={styles.rowValue}>{formatDuration(point.duration_minutes)}</Text>
            </View>
            {point.comment && (
              <>
                <View style={styles.separator} />
                <View style={styles.commentBlock}>
                  <Text style={styles.rowLabel}>Commentaire</Text>
                  <Text style={styles.commentText}>{point.comment}</Text>
                </View>
              </>
            )}
          </View>

          {/* Partenaire */}
          {partnerProfile && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Partenaire tagué</Text>
              <View style={styles.partnerRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>
                    {(partnerProfile.display_name ?? partnerProfile.username)[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partnerProfile.display_name}</Text>
                  <Text style={styles.partnerUsername}>@{partnerProfile.username}</Text>
                </View>
                {partnerRecord && (
                  <Text style={styles.consentStatus}>
                    {consentLabel(partnerRecord.status)}
                  </Text>
                )}
              </View>

              {/* Boutons consentement — visible uniquement pour le partenaire en attente */}
              {isPartner && isPending && !editing && (
                <View style={styles.consentActions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={enterEditMode}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={() => handleConsent(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.acceptButtonText}>Accepter</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => handleConsent(false)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.rejectButtonText}>Refuser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Formulaire d'édition partenaire */}
          {editing && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier le point</Text>

              {/* Note */}
              <Text style={styles.editLabel}>Note</Text>
              <View style={styles.editNoteRow}>
                <Text style={[styles.editNoteValue, { color: noteColor(editNote) }]}>{editNote}/10</Text>
              </View>
              <View style={styles.editStarsRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity key={n} onPress={() => setEditNote(n)} style={styles.editStarButton}>
                    <Text style={[styles.editStar, { color: n <= editNote ? noteColor(editNote) : '#333' }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Durée */}
              <Text style={styles.editLabel}>Durée (minutes)</Text>
              <TextInput
                style={styles.editInput}
                value={editDuration}
                onChangeText={(v) => setEditDuration(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="Durée en minutes"
                placeholderTextColor="#555"
              />

              {/* Date */}
              <Text style={styles.editLabel}>Date</Text>
              <TouchableOpacity
                style={styles.editDateButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.editDateText}>
                  📅 {editDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                locale="fr"
                mode="single"
                visible={showDatePicker}
                onDismiss={() => setShowDatePicker(false)}
                date={editDate}
                onConfirm={({ date: picked }) => {
                  setShowDatePicker(false);
                  if (picked) setEditDate(picked);
                }}
                validRange={{ endDate: new Date() }}
                label="Choisir une date"
                saveLabel="Confirmer"
              />

              {/* Commentaire */}
              <Text style={styles.editLabel}>Commentaire</Text>
              <TextInput
                style={styles.editCommentInput}
                value={editComment}
                onChangeText={(v) => v.length <= 500 && setEditComment(v)}
                multiline
                numberOfLines={3}
                placeholder="Commentaire..."
                placeholderTextColor="#555"
                maxLength={500}
              />
              <Text style={styles.editCharCount}>{editComment.length}/500</Text>

              {/* Actions édition */}
              <View style={styles.consentActions}>
                <TouchableOpacity
                  style={styles.cancelEditButton}
                  onPress={() => setEditing(false)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelEditText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveAcceptButton, saving && styles.buttonDisabled]}
                  onPress={handleSaveAndAccept}
                  disabled={saving}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveAcceptText}>
                    {saving ? 'Sauvegarde...' : 'Sauvegarder et accepter'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => { setEditing(false); handleConsent(false); }}
                activeOpacity={0.8}
              >
                <Text style={styles.rejectButtonText}>Refuser</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Actions propriétaire */}
          {isOwner && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
              <Text style={styles.deleteButtonText}>Supprimer ce point</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Bouton retour */}
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← Retour</Text>
      </TouchableOpacity>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  centered: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
  },
  miniMap: {
    height: 200,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 16,
  },
  partnerBadge: {
    alignSelf: 'center',
    backgroundColor: '#e91e8c22',
    borderWidth: 1,
    borderColor: '#e91e8c44',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  partnerBadgeText: {
    color: '#e91e8c',
    fontSize: 13,
    fontWeight: '600',
  },
  photosRow: {
    marginBottom: 12,
  },
  photoThumb: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#1a1a1a',
  },
  noteContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  noteValue: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stars: {
    fontSize: 20,
    color: '#e91e8c',
    letterSpacing: 2,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    color: '#888888',
    fontSize: 13,
  },
  rowValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#2a2a2a',
    marginVertical: 8,
  },
  commentBlock: {
    paddingVertical: 4,
  },
  commentText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 18,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  partnerUsername: {
    color: '#888888',
    fontSize: 12,
  },
  consentStatus: {
    color: '#888888',
    fontSize: 12,
  },
  consentActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 14,
  },
  editButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e91e8c',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#e91e8c',
    fontWeight: '600',
    fontSize: 14,
  },
  editLabel: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  editNoteRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  editNoteValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  editStarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  editStarButton: {
    padding: 2,
  },
  editStar: {
    fontSize: 22,
  },
  editInput: {
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  editDateButton: {
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  editDateText: {
    color: '#ffffff',
    fontSize: 14,
  },
  editCommentInput: {
    backgroundColor: '#0f0f0f',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  editCharCount: {
    color: '#555',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 8,
  },
  cancelEditButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelEditText: {
    color: '#888888',
    fontWeight: '500',
    fontSize: 14,
  },
  saveAcceptButton: {
    flex: 2,
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveAcceptText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 15,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: 16,
    backgroundColor: '#1a1a1acc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

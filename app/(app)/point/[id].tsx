import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Snackbar } from 'react-native-paper';
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
  const { deletePoint } = usePoints();

  const [point, setPoint] = useState<MapPoint | null>(null);
  const [partnerRecord, setPartnerRecord] = useState<PointPartner | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Champs éditables pour le partenaire
  const [editNote, setEditNote] = useState<number>(5);
  const [editComment, setEditComment] = useState<string>('');
  const [editDuration, setEditDuration] = useState<string>('');
  const [approving, setApproving] = useState(false);

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
      const coords = (raw.location as { coordinates: [number, number] })?.coordinates ?? [0, 0];
      const mapped = { ...raw, longitude: coords[0], latitude: coords[1] } as MapPoint;
      setPoint(mapped);
      // Initialiser les champs éditables depuis le point
      setEditNote(raw.note);
      setEditComment(raw.comment ?? '');
      setEditDuration(raw.duration_minutes?.toString() ?? '');
    }

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

  async function handleApprove() {
    if (!partnerRecord) return;
    setApproving(true);
    const { data, error } = await supabase.rpc('accept_point_as_partner', {
      p_point_id: partnerRecord.point_id,
      p_new_note: editNote,
      p_new_comment: editComment.trim() || null,
      p_new_duration: editDuration ? parseInt(editDuration, 10) : null,
    });

    if (error || data === false) {
      setSnackbar('Erreur lors de l\'approbation.');
      setApproving(false);
      return;
    }
    setSnackbar('Point approuvé et publié !');
    setApproving(false);
    await loadPoint();
  }

  async function handleReject() {
    if (!partnerRecord) return;
    const { error } = await supabase
      .from('point_partners')
      .update({ status: 'rejected', responded_at: new Date().toISOString() })
      .eq('id', partnerRecord.id);

    if (error) {
      setSnackbar('Erreur lors du refus.');
      return;
    }
    setSnackbar('Point refusé.');
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
  const editColor = noteColor(editNote);

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

          {/* ─── Bandeau créateur : en attente d'approbation ─── */}
          {isOwner && isPending && partnerProfile && (
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingBannerText}>
                ⏳ En attente d'approbation de{' '}
                <Text style={styles.pendingBannerName}>
                  {partnerProfile.display_name ?? partnerProfile.username}
                </Text>
              </Text>
              {partnerRecord?.notified_at && (
                <Text style={styles.pendingBannerDate}>
                  Envoyé le {formatDate(partnerRecord.notified_at)}
                </Text>
              )}
            </View>
          )}

          {/* ─── Section partenaire : formulaire d'approbation ─── */}
          {isPartner && isPending && (
            <View style={styles.approvalCard}>
              <Text style={styles.approvalTitle}>Approuver ce point</Text>
              <Text style={styles.approvalSubtitle}>
                Ce point ne sera visible par vos amis communs qu'après ton approbation.
                Tu peux modifier les informations avant de valider.
              </Text>

              {/* Note éditable */}
              <Text style={styles.fieldLabel}>Note</Text>
              <View style={styles.noteRow}>
                <Text style={[styles.noteValue, { color: editColor }]}>{editNote}/10</Text>
              </View>
              <View style={styles.starsRow}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <TouchableOpacity key={n} onPress={() => setEditNote(n)} style={styles.starButton}>
                    <Text style={[styles.star, { color: n <= editNote ? editColor : '#333' }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Durée éditable */}
              <Text style={styles.fieldLabel}>Durée (minutes)</Text>
              <TextInput
                style={styles.editInput}
                value={editDuration}
                onChangeText={(v) => setEditDuration(v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor="#555"
              />

              {/* Commentaire éditable */}
              <Text style={styles.fieldLabel}>Commentaire</Text>
              <TextInput
                style={[styles.editInput, styles.editInputMultiline]}
                value={editComment}
                onChangeText={(v) => v.length <= 500 && setEditComment(v)}
                multiline
                numberOfLines={3}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor="#555"
                maxLength={500}
              />

              {/* Boutons */}
              <View style={styles.consentActions}>
                <TouchableOpacity
                  style={[styles.approveButton, approving && styles.buttonDisabled]}
                  onPress={handleApprove}
                  disabled={approving}
                  activeOpacity={0.8}
                >
                  {approving
                    ? <ActivityIndicator size="small" color="#ffffff" />
                    : <Text style={styles.approveButtonText}>✓ Approuver et publier</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={handleReject}
                  activeOpacity={0.8}
                >
                  <Text style={styles.rejectButtonText}>✕ Refuser</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Note (mode lecture) */}
          {!isPartner || !isPending ? (
            <View style={styles.noteContainer}>
              <Text style={[styles.noteDisplay, { color }]}>{point.note}/10</Text>
              <Text style={styles.stars}>
                {'★'.repeat(point.note)}{'☆'.repeat(10 - point.note)}
              </Text>
            </View>
          ) : null}

          {/* Détails */}
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date</Text>
              <Text style={styles.rowValue}>{formatDate(point.created_at)}</Text>
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

          {/* Partenaire tagué */}
          {partnerProfile && (!isPartner || !isPending) && (
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
  // Bandeau créateur pending
  pendingBanner: {
    backgroundColor: '#ff980022',
    borderWidth: 1,
    borderColor: '#ff980066',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  pendingBannerText: {
    color: '#ff9800',
    fontSize: 14,
    lineHeight: 20,
  },
  pendingBannerName: {
    fontWeight: '600',
  },
  pendingBannerDate: {
    color: '#ff980099',
    fontSize: 12,
    marginTop: 4,
  },
  // Carte d'approbation partenaire
  approvalCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e91e8c44',
    padding: 16,
    marginBottom: 12,
  },
  approvalTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  approvalSubtitle: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#888888',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 12,
  },
  noteRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  noteValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  starButton: {
    padding: 3,
  },
  star: {
    fontSize: 24,
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
  editInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  consentActions: {
    gap: 10,
    marginTop: 16,
  },
  approveButton: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  approveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  rejectButton: {
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectButtonText: {
    color: '#f44336',
    fontWeight: '600',
    fontSize: 15,
  },
  // Affichage note (mode lecture)
  noteContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  noteDisplay: {
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

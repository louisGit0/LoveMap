import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { DatePickerModal } from 'react-native-paper-dates';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriendStore } from '@/stores/friendStore';
import { supabase } from '@/lib/supabase';
import { T } from '@/constants/theme';
import { F } from '@/constants/fonts';
import { IcoArrow, IcoSearch, IcoClose } from '@/components/icons';

function formatDateFR(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0a0a0a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
];

export default function NewPoint() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createPoint } = usePoints();
  const friends = useFriendStore((s) => s.friends);
  const params = useLocalSearchParams<{ latitude: string; longitude: string }>();

  const hasParams =
    !!params.latitude && !!params.longitude &&
    !isNaN(parseFloat(params.latitude)) && !isNaN(parseFloat(params.longitude));

  const [latitude, setLatitude] = useState(hasParams ? parseFloat(params.latitude!) : 48.8566);
  const [longitude, setLongitude] = useState(hasParams ? parseFloat(params.longitude!) : 2.3522);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [note, setNote] = useState(7);
  const [comment, setComment] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [happenedAt, setHappenedAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const mapRef = useRef<MapView>(null);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results[0]) {
        const r = results[0];
        setAddress([r.street, r.city, r.region].filter(Boolean).join(', '));
      }
    } catch {
      // Silently fail — address is optional
    }
  }

  function animateTo(lat: number, lng: number) {
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      600
    );
  }

  useEffect(() => {
    if (hasParams) {
      reverseGeocode(latitude, longitude);
      return;
    }
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { reverseGeocode(latitude, longitude); return; }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        animateTo(lat, lng);
        reverseGeocode(lat, lng);
      } catch {
        reverseGeocode(latitude, longitude);
      }
    })();
  }, []);

  async function handleSearch() {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      const results = await Location.geocodeAsync(query);
      if (!results || results.length === 0) { setSnackbar('Adresse introuvable.'); return; }
      const { latitude: lat, longitude: lng } = results[0];
      setLatitude(lat);
      setLongitude(lng);
      animateTo(lat, lng);
      reverseGeocode(lat, lng);
    } catch {
      setSnackbar('Adresse introuvable.');
    }
  }

  async function handleSubmit() {
    if (!user) return;
    if (!selectedPartnerId) {
      setSnackbar('Un partenaire est obligatoire pour publier un moment.');
      return;
    }
    setSubmitting(true);

    const happenedAtIso = new Date(
      happenedAt.getFullYear(), happenedAt.getMonth(), happenedAt.getDate(), 12, 0, 0
    ).toISOString();

    const point = await createPoint({
      userId: user.id,
      latitude,
      longitude,
      note,
      comment: comment.trim() || undefined,
      durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
      happenedAt: happenedAtIso,
      address: address || undefined,
    });

    if (!point) {
      setSnackbar('Erreur lors de la création.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('point_partners').insert({
      point_id: point.id,
      partner_id: selectedPartnerId,
      status: 'pending',
      notified_at: new Date().toISOString(),
    });

    if (!error) {
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('push_token, display_name')
        .eq('id', selectedPartnerId)
        .single();

      if (partnerProfile?.push_token) {
        const senderName = user.user_metadata?.display_name ?? 'Quelqu\'un';
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: partnerProfile.push_token,
            title: 'LoveMap — Vous avez été tagué',
            body: `${senderName} vous a tagué sur un moment. Acceptez-vous ?`,
            data: { pointId: point.id, type: 'partner_tag' },
          }),
        });
      }
    }

    setSubmitting(false);
    router.replace('/(app)/map');
  }

  const selectedPartner = friends.find((f) => f.profile.id === selectedPartnerId);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
          <View style={styles.innerBorder} pointerEvents="none" />
          <Text style={styles.eyebrow}>N° 001 — Nouveau</Text>
          <Text style={styles.title}>Inscrire{'\n'}un moment.</Text>
        </View>

        <View style={styles.body}>
          {/* Recherche d'adresse */}
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rechercher une adresse"
              placeholderTextColor={T.textFaint}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} activeOpacity={0.8}>
              <IcoSearch size={16} color={T.textFaint} />
            </TouchableOpacity>
          </View>

          {/* Adresse résolue */}
          {address ? (
            <Text style={styles.addressResolved} numberOfLines={1}>{address}</Text>
          ) : null}

          {/* Mini carte */}
          <View style={styles.miniMap}>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
              initialRegion={{ latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
              customMapStyle={darkMapStyle}
            >
              <Marker
                coordinate={{ latitude, longitude }}
                pinColor={T.primary}
                draggable
                onDragEnd={(e) => {
                  const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
                  setLatitude(lat);
                  setLongitude(lng);
                  reverseGeocode(lat, lng);
                }}
              />
            </MapView>
          </View>

          {/* Séparateur */}
          <View style={styles.divider} />

          {/* Note */}
          <Text style={styles.fieldEyebrow}>Note</Text>
          <View style={styles.noteDisplay}>
            <Text style={styles.noteValue}>{note}</Text>
            <Text style={styles.noteDenom}>/10</Text>
          </View>
          <View style={styles.noteSegments}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setNote(n)}
                style={[styles.segment, n <= note && styles.segmentActive]}
                activeOpacity={0.7}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Commentaire */}
          <Text style={styles.fieldEyebrow}>Commentaire</Text>
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={(v) => v.length <= 500 && setComment(v)}
            multiline
            numberOfLines={4}
            placeholder="Décrivez ce moment..."
            placeholderTextColor={T.textFaint}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>

          <View style={styles.divider} />

          {/* Durée */}
          <Text style={styles.fieldEyebrow}>Durée (minutes)</Text>
          <TextInput
            style={styles.lineInput}
            value={durationMinutes}
            onChangeText={(v) => setDurationMinutes(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            placeholder="—"
            placeholderTextColor={T.textFaint}
          />

          <View style={styles.divider} />

          {/* Date */}
          <Text style={styles.fieldEyebrow}>Date</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateField}
            activeOpacity={0.7}
          >
            <Text style={styles.dateText}>{formatDateFR(happenedAt)}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Partenaire */}
          <Text style={styles.fieldEyebrow}>Taguer un partenaire (obligatoire)</Text>
          {friends.length === 0 ? (
            <Text style={styles.noFriends}>Aucun ami dans votre cercle.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partnerScroll}>
              {friends.map((f) => {
                const selected = f.profile.id === selectedPartnerId;
                return (
                  <TouchableOpacity
                    key={f.profile.id}
                    onPress={() => setSelectedPartnerId(selected ? null : f.profile.id)}
                    style={[styles.partnerChip, selected && styles.partnerChipActive]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.partnerAvatar, selected && styles.partnerAvatarActive]}>
                      <Text style={[styles.partnerInitial, selected && styles.partnerInitialActive]}>
                        {(f.profile.display_name ?? f.profile.username)[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={[styles.partnerName, selected && styles.partnerNameActive]}>
                      {f.profile.display_name ?? f.profile.username}
                    </Text>
                    {selected && <IcoClose size={12} color={T.bg} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.divider} />

          {/* CTA */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !selectedPartnerId}
            style={[styles.cta, (submitting || !selectedPartnerId) && { opacity: 0.5 }]}
            activeOpacity={0.88}
          >
            <View style={styles.ctaLeft}>
              <Text style={styles.ctaEyebrow}>Archiver</Text>
              <Text style={styles.ctaLabel}>{submitting ? 'Scellement...' : 'Sceller la page'}</Text>
            </View>
            <View style={styles.ctaArrow}>
              <IcoArrow size={20} color={T.primary} dir="right" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>

      <DatePickerModal
        locale="fr"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={happenedAt}
        validRange={{ endDate: new Date() }}
        onConfirm={({ date: picked }) => {
          setShowDatePicker(false);
          if (picked) setHappenedAt(picked);
        }}
        label="Choisir une date"
        saveLabel="Confirmer"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  header: {
    paddingBottom: 24,
    paddingHorizontal: 36,
    position: 'relative',
  },
  innerBorder: {
    position: 'absolute',
    top: 16, left: 16, right: 16, bottom: 0,
    borderWidth: 1,
    borderColor: T.border,
    borderBottomWidth: 0,
  },
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 8,
  },
  title: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -1.5,
    color: T.text,
  },
  body: {
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
    paddingVertical: 12,
  },
  searchBtn: {
    padding: 10,
  },
  addressResolved: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 1,
    color: T.textFaint,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  miniMap: {
    height: 200,
    backgroundColor: T.surface,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 24,
  },
  fieldEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 12,
  },
  noteDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  noteValue: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 64,
    lineHeight: 64,
    color: T.primary,
    letterSpacing: -2,
  },
  noteDenom: {
    fontFamily: F.mono,
    fontSize: 16,
    color: T.textFaint,
    marginLeft: 4,
    marginBottom: 8,
  },
  noteSegments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 4,
    backgroundColor: T.surface2,
  },
  segmentActive: {
    backgroundColor: T.primary,
  },
  commentInput: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 18,
    color: T.text,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 0,
    lineHeight: 26,
  },
  charCount: {
    fontFamily: F.mono,
    fontSize: 9,
    color: T.textFaint,
    textAlign: 'right',
    marginTop: 6,
    letterSpacing: 1,
  },
  lineInput: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 22,
    color: T.text,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 8,
  },
  dateField: {
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    paddingVertical: 8,
  },
  dateText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 22,
    color: T.text,
  },
  noFriends: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
  },
  partnerScroll: {
    marginTop: 4,
  },
  partnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    gap: 8,
  },
  partnerChipActive: {
    backgroundColor: T.primary,
    borderColor: T.primary,
  },
  partnerAvatar: {
    width: 28,
    height: 28,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarActive: {
    backgroundColor: T.bg,
    borderColor: T.bg,
  },
  partnerInitial: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 14,
    color: T.textDim,
  },
  partnerInitialActive: {
    color: T.primary,
  },
  partnerName: {
    fontFamily: F.sans,
    fontSize: 13,
    color: T.textDim,
  },
  partnerNameActive: {
    color: T.bg,
  },
  cta: {
    flexDirection: 'row',
    height: 64,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
    marginTop: 8,
  },
  ctaLeft: {
    flex: 1,
    backgroundColor: T.primary,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 2,
  },
  ctaEyebrow: {
    fontFamily: F.mono,
    fontSize: 9,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.text,
    opacity: 0.7,
  },
  ctaLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 26,
    letterSpacing: -0.5,
    color: T.text,
    lineHeight: 28,
  },
  ctaArrow: {
    width: 64,
    backgroundColor: T.bg,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLink: {
    marginTop: 20,
    alignSelf: 'center',
  },
  cancelText: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 15,
    color: T.textFaint,
    textDecorationLine: 'underline',
  },
  snackbar: { backgroundColor: T.surface2 },
});

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { usePreventRemove, useNavigation } from '@react-navigation/native';
import { Snackbar } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { haptics } from '@/lib/haptics';
import { mapboxStaticUrl } from '@/constants/config';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriendStore } from '@/stores/friendStore';
import { useTheme } from '@/hooks/useTheme';
import { F } from '@/constants/fonts';
import type { Theme } from '@/constants/theme';
import { IcoArrow, IcoSearch, IcoClose } from '@/components/icons';


export default function NewPoint() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { createPoint } = usePoints();
  const friends = useFriendStore((s) => s.friends);
  const params = useLocalSearchParams<{ latitude: string; longitude: string }>();
  const navigation = useNavigation();
  const T = useTheme();
  const styles = useMemo(() => makeStyles(T), [T]);

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
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const today = new Date();
  const [dayStr, setDayStr] = useState(String(today.getDate()).padStart(2, '0'));
  const [monthStr, setMonthStr] = useState(String(today.getMonth() + 1).padStart(2, '0'));
  const [yearStr, setYearStr] = useState(String(today.getFullYear()));

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
      if (!results || results.length === 0) { setSnackbar('Adresse introuvable — modifiez votre recherche.'); return; }
      const { latitude: lat, longitude: lng } = results[0];
      setLatitude(lat);
      setLongitude(lng);
      reverseGeocode(lat, lng);
    } catch {
      setSnackbar('Adresse introuvable — modifiez votre recherche.');
    }
  }

  async function handleSubmit() {
    if (!user) return;
    if (selectedPartnerIds.length === 0) {
      haptics.warn();
      setSnackbar('Vous devez mentionner au moins un partenaire pour sceller ce moment.');
      return;
    }

    // Vérification coordonnées avant soumission
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      haptics.warn();
      setSnackbar('Position GPS manquante. Autorisez la localisation et réessayez.');
      return;
    }

    setSubmitting(true);

    const d = parseInt(dayStr, 10);
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);
    const parsedDate = new Date(y, m - 1, d);
    const happenedAt = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

    let point = null;
    try {
      point = await createPoint({
        userId: user.id,
        latitude,
        longitude,
        note,
        comment: comment.trim() || undefined,
        durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : undefined,
        happenedAt,
        address: address || undefined,
        partnerIds: selectedPartnerIds,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      haptics.error();
      setSnackbar('Erreur : ' + msg);
      setSubmitting(false);
      return;
    }

    if (!point) {
      setSnackbar('Création échouée — réponse vide du serveur.');
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    haptics.success();
    router.replace('/(app)/map');
  }

  // D-04 — garde de fermeture : confirmation si une saisie est en cours.
  // Couvre le swipe-down natif ET le lien tertiaire « Abandonner la saisie ».
  // Note : le tap-backdrop ne déclenche pas ce callback (react-native-screens #3568, accepté Option A).
  const isDirty =
    comment.trim() !== '' ||
    durationMinutes !== '' ||
    note !== 7 ||
    selectedPartnerIds.length > 0;

  usePreventRemove(isDirty, ({ data }) => {
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
        <View style={styles.body}>
          {/* Eyebrow de page */}
          <Text style={styles.eyebrow}>N° 001 — Nouvelle page</Text>

          {/* NOTE — geste central, le hero de la page (D-10) */}
          <View style={styles.noteDisplay}>
            <Text style={styles.noteValue} maxFontSizeMultiplier={1.15}>{note}</Text>
            <Text style={styles.noteDenom}>/10</Text>
          </View>
          <View style={styles.noteSegments}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => { haptics.select(); setNote(n); }}
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
            placeholder="Décrivez ce moment…"
            placeholderTextColor={T.textFaint}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>

          <View style={styles.divider} />

          {/* Partenaires — au moins un, plusieurs possibles */}
          <View style={styles.partnerLabelRow}>
            <Text style={styles.fieldEyebrow}>Partenaires</Text>
            <Text style={styles.fieldRequired}>Au moins un</Text>
          </View>
          {friends.length === 0 ? (
            <Text style={styles.noFriends}>Ajoutez un ami à votre cercle pour inscrire un moment.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.partnerScroll}>
              {friends.map((f) => {
                const selected = selectedPartnerIds.includes(f.profile.id);
                return (
                  <TouchableOpacity
                    key={f.profile.id}
                    onPress={() => {
                      haptics.select();
                      setSelectedPartnerIds((prev) =>
                        prev.includes(f.profile.id)
                          ? prev.filter((id) => id !== f.profile.id)
                          : [...prev, f.profile.id]
                      );
                    }}
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

          <View style={styles.divider} />

          {/* Lieu — recherche → mini-carte → adresse résolue */}
          <Text style={styles.fieldEyebrow}>Lieu</Text>
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
            <TouchableOpacity
              style={styles.searchBtn}
              onPress={handleSearch}
              activeOpacity={0.8}
              accessibilityLabel="Rechercher"
            >
              <IcoSearch size={16} color={T.textFaint} />
            </TouchableOpacity>
          </View>

          {/* Aperçu carte STATIQUE (Mapbox Static Images via <Image>) — fiable dans un
              `modal` (cf. règle 19). Pin rose dessiné en RN. */}
          <View style={styles.miniMap}>
            <Image
              source={{ uri: mapboxStaticUrl(longitude, latitude) }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
            <View style={styles.centerPin} pointerEvents="none">
              <View style={styles.centerPinDot} />
            </View>
          </View>
          <View style={styles.locationStamp}>
            <View style={styles.locationPinDot} />
            <Text style={styles.locationStampText} numberOfLines={2}>
              {address || `Position : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* CTA — Sceller la page (inline-fin) */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || friends.length === 0}
            style={[styles.cta, (submitting || friends.length === 0) && { opacity: 0.4 }]}
            activeOpacity={0.88}
          >
            <View style={styles.ctaLeft}>
              <Text style={styles.ctaEyebrow}>Archiver</Text>
              <Text style={styles.ctaLabel}>{submitting ? 'Scellement…' : 'Sceller la page'}</Text>
            </View>
            <View style={styles.ctaArrow}>
              <IcoArrow size={20} color={T.primary} dir="right" />
            </View>
          </TouchableOpacity>

          {/* Lien tertiaire — Abandonner la saisie */}
          <TouchableOpacity onPress={() => router.back()} style={styles.cancelLink} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Abandonner la saisie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000} style={styles.snackbar}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

const makeStyles = (T: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  scroll: {
    flex: 1,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  // Eyebrow (10 / Eyebrow) — accent T.primary réservé à l'en-tête de page
  eyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.primary,
    marginBottom: 24,
  },
  // NOTE hero (72 / Display)
  noteDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  noteValue: {
    fontFamily: F.serifLight,
    fontStyle: 'italic',
    fontSize: 72,
    lineHeight: 68,
    color: T.primary,
    letterSpacing: -2,
  },
  noteDenom: {
    fontFamily: F.mono,
    fontSize: 20,
    color: T.textFaint,
    marginLeft: 8,
    marginBottom: 8,
  },
  noteSegments: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 6,
    backgroundColor: T.surface2,
    borderRadius: T.radiusXs,
    borderCurve: 'continuous',
  },
  segmentActive: {
    backgroundColor: T.primary,
  },
  divider: {
    height: 1,
    backgroundColor: T.border,
    marginVertical: 24,
  },
  // Field labels (10 / Eyebrow)
  fieldEyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
    marginBottom: 12,
  },
  // Inputs serif italic (20 / Body)
  commentInput: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.text,
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 0,
    lineHeight: 28,
  },
  charCount: {
    fontFamily: F.mono,
    fontSize: 10,
    color: T.textFaint,
    textAlign: 'right',
    marginTop: 8,
    letterSpacing: 1,
  },
  partnerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldRequired: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: T.primary,
  },
  noFriends: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    lineHeight: 28,
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
    borderRadius: T.radiusSm,
    borderCurve: 'continuous',
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
    fontSize: 20,
    color: T.textDim,
  },
  partnerInitialActive: {
    color: T.primary,
  },
  partnerName: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.textDim,
  },
  partnerNameActive: {
    color: T.bg,
  },
  lineInput: {
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 20,
    color: T.text,
    paddingVertical: 12,
  },
  searchBtn: {
    padding: 8,
  },
  miniMap: {
    height: 200,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
    borderRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  centerPin: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: T.primary,
    borderWidth: 2,
    borderColor: T.bg,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  addressResolved: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: T.textFaint,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  // Cartouche de position (remplace l'aperçu carte, noir dans un form sheet iOS)
  locationStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  locationPinDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: T.primary,
  },
  locationStampText: {
    flex: 1,
    fontFamily: F.mono,
    fontSize: 12,
    letterSpacing: 0.3,
    color: T.textDim,
  },
  // CTA bloc (24 / Heading) — radiusMd + borderCurve continuous (D-12)
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
    gap: 4,
    borderTopLeftRadius: T.radiusMd,
    borderBottomLeftRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  ctaEyebrow: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: T.text,
    opacity: 0.7,
  },
  ctaLabel: {
    fontFamily: F.serif,
    fontStyle: 'italic',
    fontSize: 24,
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
    borderTopRightRadius: T.radiusMd,
    borderBottomRightRadius: T.radiusMd,
    borderCurve: 'continuous',
  },
  cancelLink: {
    marginTop: 24,
    alignSelf: 'center',
  },
  // Lien tertiaire (10 / Eyebrow, mono uppercase)
  cancelText: {
    fontFamily: F.mono,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.textFaint,
  },
  snackbar: { backgroundColor: T.surface2 },
});

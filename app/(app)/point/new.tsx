import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
import { useFriendStore } from '@/stores/friendStore';
import { supabase } from '@/lib/supabase';
import { PointForm, PointFormData } from '@/components/point/PointForm';

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d2137' }] },
];

export default function NewPoint() {
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
        if (status !== 'granted') {
          reverseGeocode(latitude, longitude);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
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
      if (!results || results.length === 0) {
        setSnackbar('Adresse introuvable.');
        return;
      }
      const { latitude: lat, longitude: lng } = results[0];
      setLatitude(lat);
      setLongitude(lng);
      animateTo(lat, lng);
      reverseGeocode(lat, lng);
    } catch {
      setSnackbar('Adresse introuvable.');
    }
  }

  async function handleSubmit(data: PointFormData) {
    if (!user) return;

    const point = await createPoint({
      userId: user.id,
      latitude,
      longitude,
      note: data.note,
      comment: data.comment,
      durationMinutes: data.durationMinutes,
      happenedAt: data.happenedAt,
      address: address || undefined,
    });

    if (!point) {
      setSnackbar('Erreur lors de la création du point.');
      return;
    }

    // Taguer le partenaire (obligatoire)
    const { error } = await supabase.from('point_partners').insert({
      point_id: point.id,
      partner_id: data.partnerId!,
      status: 'pending',
      notified_at: new Date().toISOString(),
    });

    if (!error) {
      // Envoyer notification push au partenaire
      const { data: partnerProfile } = await supabase
        .from('profiles')
        .select('push_token, display_name')
        .eq('id', data.partnerId!)
        .single();

      if (partnerProfile?.push_token) {
        const senderName = user.user_metadata?.display_name ?? 'Quelqu\'un';
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: partnerProfile.push_token,
            title: 'LoveMap — Vous avez été tagué',
            body: `${senderName} vous a tagué sur un point. Acceptez-vous ?`,
            data: { pointId: point.id, type: 'partner_tag' },
          }),
        });
      }
    }

    router.replace('/(app)/map');
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.title}>Nouveau point</Text>

        {/* Barre de recherche d'adresse */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Rechercher une adresse..."
            placeholderTextColor="#555"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch} activeOpacity={0.8}>
            <Text style={styles.searchButtonText}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Carte interactive — déplacer le marqueur pour ajuster l'emplacement */}
        <Text style={styles.mapHint}>Déplacez le marqueur pour ajuster l'emplacement</Text>
        <View style={styles.miniMap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            customMapStyle={darkMapStyle}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              pinColor="#e91e8c"
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

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <PointForm
            latitude={latitude}
            longitude={longitude}
            address={address}
            friends={friends}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
          />
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  searchRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 14,
  },
  searchButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  mapHint: {
    color: '#888888',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
  },
  miniMap: {
    height: 220,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a2e',
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  snackbar: {
    backgroundColor: '#1a1a1a',
  },
});

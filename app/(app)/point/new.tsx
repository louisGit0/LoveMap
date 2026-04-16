import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Snackbar } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/hooks/useAuth';
import { usePoints } from '@/hooks/usePoints';
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
  const params = useLocalSearchParams<{ latitude: string; longitude: string }>();

  const [latitude, setLatitude] = useState(parseFloat(params.latitude ?? '48.8566'));
  const [longitude, setLongitude] = useState(parseFloat(params.longitude ?? '2.3522'));

  const [snackbar, setSnackbar] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  function handleLocationChange(lat: number, lng: number) {
    setLatitude(lat);
    setLongitude(lng);
    mapRef.current?.animateToRegion(
      { latitude: lat, longitude: lng, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      500
    );
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
    });

    if (!point) {
      setSnackbar('Erreur lors de la création du point.');
      return;
    }

    // Créer l'entrée point_partners (partenaire toujours requis)
    const { error: ppError } = await supabase.from('point_partners').insert({
      point_id: point.id,
      partner_id: data.partnerId,
      status: 'pending',
      notified_at: new Date().toISOString(),
    });

    if (ppError) {
      setSnackbar('Point créé mais erreur lors du taguage du partenaire.');
      setTimeout(() => router.replace('/(app)/map'), 2500);
      return;
    }

    // Récupérer le profil du partenaire pour la notification et le snackbar
    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('push_token, display_name, username')
      .eq('id', data.partnerId)
      .single();

    const partnerName = partnerProfile?.display_name ?? partnerProfile?.username ?? 'ton partenaire';

    // Envoyer notification push au partenaire
    if (partnerProfile?.push_token) {
      const senderName =
        user.user_metadata?.display_name ?? user.user_metadata?.username ?? 'Quelqu\'un';
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: partnerProfile.push_token,
          title: 'LoveMap — Tu as été tagué',
          body: `${senderName} t'a tagué sur un point. Tu peux le consulter et l'approuver.`,
          data: { pointId: point.id, type: 'partner_tag' },
        }),
      });
    }

    setSnackbar(`Point créé ! En attente d'approbation de ${partnerName}.`);
    setTimeout(() => router.replace('/(app)/map'), 2500);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Nouveau point</Text>

        <Text style={styles.mapHint}>Déplacez le marqueur ou cherchez une adresse ci-dessous</Text>
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
            onPress={(e) => {
              const { latitude: lat, longitude: lng } = e.nativeEvent.coordinate;
              setLatitude(lat);
              setLongitude(lng);
            }}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              pinColor="#e91e8c"
              draggable
              onDragEnd={(e) => {
                setLatitude(e.nativeEvent.coordinate.latitude);
                setLongitude(e.nativeEvent.coordinate.longitude);
              }}
            />
          </MapView>
        </View>

        <View style={styles.formContainer}>
          <PointForm
            latitude={latitude}
            longitude={longitude}
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            onLocationChange={handleLocationChange}
          />
        </View>
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar(null)}
        duration={2500}
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

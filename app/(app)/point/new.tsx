import React, { useState } from 'react';
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

  const latitude = parseFloat(params.latitude ?? '48.8566');
  const longitude = parseFloat(params.longitude ?? '2.3522');

  const [snackbar, setSnackbar] = useState<string | null>(null);

  async function handleSubmit(data: PointFormData) {
    if (!user) return;

    const point = await createPoint({
      userId: user.id,
      latitude,
      longitude,
      note: data.note,
      comment: data.comment,
      durationMinutes: data.durationMinutes,
    });

    if (!point) {
      setSnackbar('Erreur lors de la création du point.');
      return;
    }

    // Taguer le partenaire si sélectionné
    if (data.partnerId) {
      const { error } = await supabase.from('point_partners').insert({
        point_id: point.id,
        partner_id: data.partnerId,
        status: 'pending',
        notified_at: new Date().toISOString(),
      });

      if (!error) {
        // Envoyer notification push au partenaire
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('push_token, display_name')
          .eq('id', data.partnerId)
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
    }

    router.replace('/(app)/map');
    // Le snackbar ne sera pas visible après replace — on passe via params si besoin
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={styles.title}>Nouveau point</Text>

        {/* Mini carte non-interactive */}
        <View style={styles.miniMap}>
          <MapView
            style={StyleSheet.absoluteFillObject}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            customMapStyle={darkMapStyle}
            pointerEvents="none"
          >
            <Marker coordinate={{ latitude, longitude }} pinColor="#e91e8c" />
          </MapView>
        </View>

        {/* Formulaire */}
        <View style={styles.formContainer}>
          <PointForm
            latitude={latitude}
            longitude={longitude}
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
  miniMap: {
    height: 180,
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

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { DatePickerModal } from 'react-native-paper-dates';
import type * as ImagePickerTypes from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import type { MapPoint, Profile } from '@/types/app.types';
import { Input } from '@/components/ui/Input';
import { PhotoPicker } from '@/components/point/PhotoPicker';

export interface PointFormData {
  note: number;
  durationMinutes?: number;
  comment?: string;
  partnerId?: string;
  happenedAt?: string;
  photos?: ImagePickerTypes.ImagePickerAsset[];
}

interface Props {
  latitude: number;
  longitude: number;
  address?: string;
  initialData?: Partial<MapPoint>;
  onSubmit: (data: PointFormData) => Promise<void>;
  onCancel: () => void;
}

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

function formatDateFR(date: Date): string {
  return `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}

export function PointForm({ latitude, longitude, address, initialData, onSubmit, onCancel }: Props) {
  const [note, setNote] = useState<number>(initialData?.note ?? 5);
  const [duration, setDuration] = useState<string>(
    initialData?.duration_minutes?.toString() ?? ''
  );
  const [comment, setComment] = useState<string>(initialData?.comment ?? '');
  const [partnerQuery, setPartnerQuery] = useState('');
  const [partnerResults, setPartnerResults] = useState<Profile[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photos, setPhotos] = useState<ImagePickerTypes.ImagePickerAsset[]>([]);

  async function handleAddPhoto() {
    const ImagePicker = await import('expo-image-picker');
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotos((prev) => [...prev, ...result.assets].slice(0, 5));
    }
  }

  // Debounced search
  useEffect(() => {
    if (partnerQuery.trim().length < 2) {
      setPartnerResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await supabase.rpc('search_users', { query: partnerQuery.trim() });
      setPartnerResults((data ?? []) as Profile[]);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [partnerQuery]);

  async function handleSubmit() {
    const happenedAt = new Date(
      date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0
    ).toISOString();
    setSubmitting(true);
    await onSubmit({
      note,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      comment: comment.trim() || undefined,
      partnerId: selectedPartner?.id,
      happenedAt,
      photos: photos.length > 0 ? photos : undefined,
    });
    setSubmitting(false);
  }

  const color = noteColor(note);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Adresse */}
      {address ? (
        <View style={styles.addressRow}>
          <Text style={styles.addressIcon}>📍</Text>
          <Text style={styles.addressText}>{address}</Text>
        </View>
      ) : null}

      {/* Note */}
      <Text style={styles.label}>Note</Text>
      <View style={styles.noteRow}>
        <Text style={[styles.noteValue, { color }]}>{note}/10</Text>
      </View>
      <View style={styles.starsRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity key={n} onPress={() => setNote(n)} style={styles.starButton}>
            <Text style={[styles.star, { color: n <= note ? color : '#333' }]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Durée */}
      <Input
        label="Durée (minutes)"
        value={duration}
        onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Date */}
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.dateButtonIcon}>📅</Text>
        <Text style={styles.dateButtonText}>{formatDateFR(date)}</Text>
      </TouchableOpacity>
      <DatePickerModal
        locale="fr"
        mode="single"
        visible={showDatePicker}
        onDismiss={() => setShowDatePicker(false)}
        date={date}
        onConfirm={({ date: picked }) => {
          setShowDatePicker(false);
          if (picked) setDate(picked);
        }}
        validRange={{ endDate: new Date() }}
        label="Choisir une date"
        saveLabel="Confirmer"
      />

      {/* Commentaire */}
      <View style={styles.commentContainer}>
        <Text style={styles.label}>Commentaire</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={(v) => v.length <= 500 && setComment(v)}
          multiline
          numberOfLines={4}
          placeholder="Décrivez ce moment..."
          placeholderTextColor="#555"
          maxLength={500}
        />
        <Text style={styles.charCount}>{comment.length}/500</Text>
      </View>

      {/* Photos */}
      <Text style={styles.label}>Photos</Text>
      <PhotoPicker
        photos={photos}
        onAdd={handleAddPhoto}
        onRemove={(i) => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
      />

      {/* Partenaire */}
      <Text style={styles.label}>Partenaire</Text>
      {selectedPartner ? (
        <View style={styles.partnerSelected}>
          <Text style={styles.partnerName}>
            {selectedPartner.display_name} (@{selectedPartner.username})
          </Text>
          <TouchableOpacity onPress={() => setSelectedPartner(null)} style={styles.removePartner}>
            <Text style={styles.removePartnerText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Input
            label="Rechercher par @pseudo"
            value={partnerQuery}
            onChangeText={setPartnerQuery}
            autoCapitalize="none"
            style={styles.input}
            right={searchLoading ? <ActivityIndicator color="#e91e8c" size="small" /> : undefined}
          />
          {partnerResults.length > 0 && (
            <View style={styles.searchResults}>
              {partnerResults.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.searchResultItem}
                  onPress={() => {
                    setSelectedPartner(u);
                    setPartnerQuery('');
                    setPartnerResults([]);
                  }}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {(u.display_name ?? u.username)[0].toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.resultName}>{u.display_name}</Text>
                    <Text style={styles.resultUsername}>@{u.username}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, (submitting || !selectedPartner) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !selectedPartner}
          activeOpacity={0.8}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Enregistrement...' : 'Enregistrer le point'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  addressIcon: {
    fontSize: 14,
  },
  addressText: {
    color: '#888888',
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  label: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  noteRow: {
    alignItems: 'center',
    marginBottom: 4,
  },
  noteValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 28,
  },
  input: {
    marginBottom: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 10,
  },
  dateButtonIcon: {
    fontSize: 18,
  },
  dateButtonText: {
    color: '#ffffff',
    fontSize: 15,
  },
  commentContainer: {
    marginBottom: 4,
  },
  commentInput: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  charCount: {
    color: '#555',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  partnerSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e91e8c44',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
  },
  partnerName: {
    color: '#ffffff',
    fontSize: 14,
  },
  removePartner: {
    padding: 4,
  },
  removePartnerText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchResults: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginTop: 4,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
    gap: 12,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e91e8c33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#e91e8c',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  resultUsername: {
    color: '#888888',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cancelButtonText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#e91e8c',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

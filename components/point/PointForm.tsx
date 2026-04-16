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
import { supabase } from '@/lib/supabase';
import type { MapPoint, Profile } from '@/types/app.types';
import { Input } from '@/components/ui/Input';

const GEOCODING_BASE = 'https://maps.googleapis.com/maps/api/geocode/json';
const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

interface GeocodingResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
}

export interface PointFormData {
  note: number;
  durationMinutes?: number;
  comment?: string;
  partnerId: string;
  happenedAt?: string;
}

interface Props {
  latitude: number;
  longitude: number;
  initialData?: Partial<MapPoint>;
  onSubmit: (data: PointFormData) => Promise<void>;
  onCancel: () => void;
  onLocationChange?: (lat: number, lng: number) => void;
}

function noteColor(note: number): string {
  if (note <= 3) return '#f44336';
  if (note <= 6) return '#ff9800';
  if (note <= 8) return '#8bc34a';
  return '#4caf50';
}

function todayParts() {
  const now = new Date();
  return {
    day: String(now.getDate()).padStart(2, '0'),
    month: String(now.getMonth() + 1).padStart(2, '0'),
    year: String(now.getFullYear()),
  };
}

export function PointForm({ initialData, onSubmit, onCancel, onLocationChange }: Props) {
  const [note, setNote] = useState<number>(initialData?.note ?? 5);
  const [duration, setDuration] = useState<string>(
    initialData?.duration_minutes?.toString() ?? ''
  );
  const [comment, setComment] = useState<string>(initialData?.comment ?? '');

  // Partenaire (obligatoire)
  const [partnerQuery, setPartnerQuery] = useState('');
  const [partnerResults, setPartnerResults] = useState<Profile[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Profile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Adresse
  const [addressQuery, setAddressQuery] = useState('');
  const [addressResults, setAddressResults] = useState<GeocodingResult[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const init = todayParts();
  const [day, setDay] = useState(init.day);
  const [month, setMonth] = useState(init.month);
  const [year, setYear] = useState(init.year);

  // Recherche adresse avec debounce 400ms
  useEffect(() => {
    if (addressQuery.trim().length < 3) {
      setAddressResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setAddressLoading(true);
      try {
        const url = `${GEOCODING_BASE}?address=${encodeURIComponent(addressQuery.trim())}&key=${MAPS_KEY}`;
        const resp = await fetch(url);
        const json = await resp.json();
        setAddressResults(((json.results ?? []) as GeocodingResult[]).slice(0, 5));
      } catch {
        setAddressResults([]);
      } finally {
        setAddressLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addressQuery]);

  // Recherche partenaire avec debounce 300ms
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

  function handleAddressSelect(result: GeocodingResult) {
    setSelectedAddress(result.formatted_address);
    setAddressQuery('');
    setAddressResults([]);
    onLocationChange?.(result.geometry.location.lat, result.geometry.location.lng);
  }

  async function handleSubmit() {
    if (!selectedPartner) return;

    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    let happenedAt: string | undefined;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= new Date().getFullYear()) {
      happenedAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();
    }

    setSubmitting(true);
    await onSubmit({
      note,
      durationMinutes: duration ? parseInt(duration, 10) : undefined,
      comment: comment.trim() || undefined,
      partnerId: selectedPartner.id,
      happenedAt,
    });
    setSubmitting(false);
  }

  const color = noteColor(note);
  const canSubmit = !!selectedPartner && !submitting;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

      {/* Adresse */}
      <Text style={styles.label}>Adresse</Text>
      {selectedAddress ? (
        <View style={styles.selectedAddress}>
          <Text style={styles.selectedAddressText} numberOfLines={2}>{selectedAddress}</Text>
          <TouchableOpacity onPress={() => setSelectedAddress('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Input
            label="Rechercher une adresse..."
            value={addressQuery}
            onChangeText={setAddressQuery}
            style={styles.input}
          />
          {addressResults.length > 0 && (
            <View style={styles.searchResults}>
              {addressResults.map((r, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.searchResultItem}
                  onPress={() => handleAddressSelect(r)}
                >
                  <Text style={styles.resultName} numberOfLines={2}>
                    {r.formatted_address}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}

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
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.dateInput, styles.dateInputShort]}
          value={day}
          onChangeText={(v) => setDay(v.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="numeric"
          placeholder="JJ"
          placeholderTextColor="#555"
          maxLength={2}
        />
        <Text style={styles.dateSep}>/</Text>
        <TextInput
          style={[styles.dateInput, styles.dateInputShort]}
          value={month}
          onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, '').slice(0, 2))}
          keyboardType="numeric"
          placeholder="MM"
          placeholderTextColor="#555"
          maxLength={2}
        />
        <Text style={styles.dateSep}>/</Text>
        <TextInput
          style={[styles.dateInput, styles.dateInputLong]}
          value={year}
          onChangeText={(v) => setYear(v.replace(/[^0-9]/g, '').slice(0, 4))}
          keyboardType="numeric"
          placeholder="AAAA"
          placeholderTextColor="#555"
          maxLength={4}
        />
      </View>

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

      {/* Partenaire (obligatoire) */}
      <Text style={styles.label}>
        Partenaire <Text style={styles.required}>*</Text>
      </Text>
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
      <Text style={styles.partnerHint}>
        Un partenaire doit approuver le point pour qu'il soit visible sur la carte.
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
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
  label: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  required: {
    color: '#e91e8c',
  },
  selectedAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e91e8c44',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
    gap: 8,
  },
  selectedAddressText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    color: '#888888',
    fontSize: 14,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  dateInput: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  dateInputShort: {
    width: 56,
  },
  dateInputLong: {
    width: 80,
  },
  dateSep: {
    color: '#555',
    fontSize: 18,
    fontWeight: 'bold',
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
  partnerHint: {
    color: '#888888',
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
    fontStyle: 'italic',
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
    flex: 1,
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
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});

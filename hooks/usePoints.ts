import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useMapStore } from '@/stores/mapStore';
import type { MapPoint } from '@/types/app.types';

// Convertit un point PostGIS en MapPoint exploitable par react-native-maps
function toMapPoint(raw: any): MapPoint {
  const coords = raw.location?.coordinates ?? [0, 0];
  return {
    ...raw,
    longitude: coords[0],
    latitude: coords[1],
  };
}

export function usePoints() {
  const { points, setPoints, addPoint, updatePoint, removePoint } = useMapStore();

  const fetchMyPoints = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('points')
      .select('*')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[usePoints] fetchMyPoints error:', error.message);
      return;
    }

    setPoints((data ?? []).map(toMapPoint));
  }, [setPoints]);

  const createPoint = useCallback(async (params: {
    userId: string;
    latitude: number;
    longitude: number;
    note: number;
    comment?: string;
    durationMinutes?: number;
    happenedAt?: string;
  }): Promise<MapPoint | null> => {
    const { data, error } = await supabase
      .from('points')
      .insert({
        creator_id: params.userId,
        // Syntaxe WKT pour PostGIS via Supabase
        location: `POINT(${params.longitude} ${params.latitude})` as any,
        note: params.note,
        comment: params.comment ?? null,
        duration_minutes: params.durationMinutes ?? null,
        happened_at: params.happenedAt ?? new Date().toISOString(),
        is_visible: false,
      })
      .select()
      .single();

    if (error) {
      console.error('[usePoints] createPoint error:', error.message);
      return null;
    }

    const mapped = toMapPoint(data);
    addPoint(mapped);
    return mapped;
  }, [addPoint]);

  const deletePoint = useCallback(async (pointId: string) => {
    const { error } = await supabase
      .from('points')
      .delete()
      .eq('id', pointId);

    if (error) {
      console.error('[usePoints] deletePoint error:', error.message);
      return false;
    }

    removePoint(pointId);
    return true;
  }, [removePoint]);

  return { points, fetchMyPoints, createPoint, deletePoint, updatePoint };
}

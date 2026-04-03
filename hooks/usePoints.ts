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
      .select('*, point_partners(partner_id, status, profiles:partner_id(username, display_name))')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[usePoints] fetchMyPoints error:', error.message);
      return;
    }

    setPoints((data ?? []).map((raw: any) => {
      const mapped = toMapPoint(raw);
      const pp = raw.point_partners?.[0];
      if (pp?.profiles) {
        mapped.partnerUsername = pp.profiles.username;
        mapped.partnerDisplayName = pp.profiles.display_name;
      }
      return mapped;
    }));
  }, [setPoints]);

  const createPoint = useCallback(async (params: {
    userId: string;
    latitude: number;
    longitude: number;
    note: number;
    comment?: string;
    durationMinutes?: number;
    happenedAt?: string;
    address?: string;
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
        address: params.address ?? null,
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

  const fetchFriendPoints = useCallback(async (friendId: string) => {
    const { data, error } = await supabase
      .from('points')
      .select('*, point_partners(partner_id, status, profiles:partner_id(username, display_name))')
      .eq('creator_id', friendId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[usePoints] fetchFriendPoints error:', error.message);
      return;
    }

    setPoints((data ?? []).map((raw: any) => {
      const mapped = toMapPoint(raw);
      const pp = raw.point_partners?.[0];
      if (pp?.profiles) {
        mapped.partnerUsername = pp.profiles.username;
        mapped.partnerDisplayName = pp.profiles.display_name;
      }
      return mapped;
    }));
  }, [setPoints]);

  const updatePointFields = useCallback(async (pointId: string, fields: {
    note?: number;
    comment?: string | null;
    duration_minutes?: number | null;
    happened_at?: string;
  }) => {
    const { error } = await supabase
      .from('points')
      .update(fields)
      .eq('id', pointId);

    if (error) {
      console.error('[usePoints] updatePointFields error:', error.message);
      return false;
    }
    return true;
  }, []);

  return { points, fetchMyPoints, fetchFriendPoints, createPoint, deletePoint, updatePoint, updatePointFields };
}

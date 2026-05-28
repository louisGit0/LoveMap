import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useMapStore } from '@/stores/mapStore';
import type { MapPoint } from '@/types/app.types';

// Convertit un point PostGIS en MapPoint exploitable
function toMapPoint(raw: any): MapPoint {
  const coords = raw.location?.coordinates ?? [0, 0];
  return {
    ...raw,
    longitude: coords[0],
    latitude: coords[1],
  };
}

// Convertit un résultat RPC (sans champ location) en MapPoint partiel
function rpcRowToMapPoint(row: any, longitude: number, latitude: number): MapPoint {
  return {
    ...row,
    longitude,
    latitude,
    location: null,
  };
}

export function usePoints() {
  const { points, setPoints, addPoint, updatePoint, removePoint } = useMapStore();

  const fetchMyPoints = useCallback(async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('points')
      .select('*, point_partners(partner_id, status, profiles:partner_id(username, display_name))')
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[usePoints] fetchMyPoints error:', error.message);
      return false;
    }

    setPoints((data ?? []).map((raw: any) => {
      const mapped = toMapPoint(raw);
      const pp = raw.point_partners?.[0];
      if (pp) {
        mapped.partnerStatus = pp.status;
        if (pp.profiles) {
          mapped.partnerUsername = pp.profiles.username;
          mapped.partnerDisplayName = pp.profiles.display_name;
        }
      }
      return mapped;
    }));
    return true;
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
    console.log('[createPoint] Params:', JSON.stringify({
      userId: params.userId,
      lat: params.latitude,
      lng: params.longitude,
      note: params.note,
    }));

    // Validation des coordonnées
    if (!params.latitude || !params.longitude ||
        isNaN(params.latitude) || isNaN(params.longitude)) {
      console.error('[createPoint] Coordonnées invalides:', params.latitude, params.longitude);
      return null;
    }

    if (!params.userId) {
      console.error('[createPoint] userId manquant');
      return null;
    }

    // Passage par RPC pour garantir la compatibilité PostGIS
    // ST_MakePoint(longitude, latitude) côté serveur — pas de problème WKT client
    const { data, error } = await supabase.rpc('create_point', {
      p_creator_id: params.userId,
      p_longitude: params.longitude,
      p_latitude: params.latitude,
      p_note: params.note,
      p_comment: params.comment ?? null,
      p_duration_minutes: params.durationMinutes ?? null,
      p_happened_at: params.happenedAt ?? new Date().toISOString(),
      p_address: params.address ?? null,
    });

    if (error) {
      console.error('[createPoint] RPC error:', error.code, error.message, error.details);
      return null;
    }

    // La RPC retourne un SETOF — prendre la première ligne
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      console.error('[createPoint] RPC a retourné une réponse vide');
      return null;
    }

    console.log('[createPoint] Point créé:', row.id);

    const mapped = rpcRowToMapPoint(row, params.longitude, params.latitude);
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

  const fetchFriendPoints = useCallback(async (friendId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('points')
      .select('*, point_partners(partner_id, status, profiles:partner_id(username, display_name))')
      .eq('creator_id', friendId)
      .eq('is_visible', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[usePoints] fetchFriendPoints error:', error.message);
      return false;
    }

    setPoints((data ?? []).map((raw: any) => {
      const mapped = toMapPoint(raw);
      const pp = raw.point_partners?.[0];
      if (pp) {
        mapped.partnerStatus = pp.status;
        if (pp.profiles) {
          mapped.partnerUsername = pp.profiles.username;
          mapped.partnerDisplayName = pp.profiles.display_name;
        }
      }
      return mapped;
    }));
    return true;
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

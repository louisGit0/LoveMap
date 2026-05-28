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
    partnerId?: string;
  }): Promise<MapPoint | null> => {

    // Vérifications préalables
    if (!params.userId) {
      console.error('[createPoint] userId manquant');
      return null;
    }
    if (!params.latitude || !params.longitude || isNaN(params.latitude) || isNaN(params.longitude)) {
      console.error('[createPoint] Coordonnées invalides:', params.latitude, params.longitude);
      return null;
    }

    // Création via RPC PostGIS
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_point', {
      p_creator_id: params.userId,
      p_longitude: params.longitude,
      p_latitude: params.latitude,
      p_note: params.note,
      p_comment: params.comment ?? null,
      p_duration_minutes: params.durationMinutes ?? null,
      p_happened_at: params.happenedAt ?? new Date().toISOString(),
      p_address: params.address ?? null,
    });

    if (rpcError) {
      console.error('[createPoint] RPC error:', rpcError.code, rpcError.message, rpcError.details);
      return null;
    }

    // Compatibilité migration 007 (RETURNS TABLE → array) et 008 (RETURNS UUID → string)
    let pointId: string | null = null;
    let rawPoint: any = null;

    if (typeof rpcData === 'string' && rpcData) {
      // Migration 008 : retourne directement l'UUID
      pointId = rpcData;
    } else if (Array.isArray(rpcData) && rpcData.length > 0 && rpcData[0]?.id) {
      // Migration 007 : retourne RETURNS TABLE → premier élément
      pointId = rpcData[0].id;
      rawPoint = rpcData[0];
    }

    if (!pointId) {
      console.error('[createPoint] ID manquant — rpcData type:', typeof rpcData, '— val:', String(rpcData).slice(0, 120));
      return null;
    }

    console.log('[createPoint] Point créé ID:', pointId);

    // Récupérer le point complet si pas déjà disponible (cas UUID)
    if (!rawPoint) {
      const { data: fetched, error: fetchError } = await supabase
        .from('points')
        .select('*')
        .eq('id', pointId)
        .maybeSingle();

      if (fetchError) {
        console.error('[createPoint] Erreur récupération point:', fetchError.code, fetchError.message);
        return null;
      }
      rawPoint = fetched;
    }

    if (!rawPoint) {
      console.error('[createPoint] Point introuvable après création, id:', pointId);
      return null;
    }

    // Garantir la présence des coordonnées (absentes dans RETURNS TABLE)
    if (!rawPoint.location) {
      rawPoint = {
        ...rawPoint,
        location: { type: 'Point', coordinates: [params.longitude, params.latitude] },
      };
    }

    const pointData = rawPoint;

    // Taguage partenaire
    if (params.partnerId) {
      const { error: partnerError } = await supabase
        .from('point_partners')
        .insert({
          point_id: pointId,
          partner_id: params.partnerId,
          status: 'pending',
          notified_at: new Date().toISOString(),
        });

      if (partnerError) {
        console.error('[createPoint] Erreur taguage partenaire:', partnerError.message);
        // Ne bloque pas — le point est créé, le taguage a échoué
      } else {
        // Notification push au partenaire
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('push_token')
          .eq('id', params.partnerId)
          .single();

        if (partnerProfile?.push_token) {
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', params.userId)
            .single();

          const senderName =
            (creatorProfile as any)?.display_name ??
            (creatorProfile as any)?.username ??
            'Quelqu\'un';

          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: (partnerProfile as any).push_token,
                title: 'LoveMap — Vous avez été tagué',
                body: `${senderName} vous a tagué sur un moment. Acceptez-vous ?`,
                data: { pointId, type: 'partner_tag' },
              }),
            });
          } catch (pushErr) {
            console.warn('[createPoint] Push notification échouée:', pushErr);
          }
        }
      }
    }

    const mapped = toMapPoint(pointData);
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

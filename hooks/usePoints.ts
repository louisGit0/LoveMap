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

// toMapPoint + enrichissement partenaire (statut + nom) depuis le join point_partners.
function enrichPoint(raw: any): MapPoint {
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
}

export function usePoints() {
  const { points, setPoints, addPoint, updatePoint, removePoint } = useMapStore();

  // Ma carte = mes points créés + les moments partagés (points où je suis partenaire ACCEPTÉ).
  // Quand un partenaire tagué accepte, le point devient is_visible=TRUE (trigger on_partner_consent)
  // et apparaît ainsi sur la carte du créateur ET sur celle de la personne mentionnée.
  const fetchMyPoints = useCallback(async (userId: string): Promise<boolean> => {
    const [ownRes, sharedRes] = await Promise.all([
      supabase
        .from('points')
        .select('*, point_partners(partner_id, status, profiles:partner_id(username, display_name))')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false }),
      // Points où JE suis le partenaire accepté (RLS : is_visible=TRUE + amitié, mig 010/011).
      supabase
        .from('point_partners')
        .select('points(*)')
        .eq('partner_id', userId)
        .eq('status', 'accepted'),
    ]);

    if (ownRes.error) {
      console.error('[usePoints] fetchMyPoints (own) error:', ownRes.error.message);
      return false;
    }
    // Échec de la requête « partagés » non bloquant : on affiche au moins les points perso.
    if (sharedRes.error) {
      console.error('[usePoints] fetchMyPoints (shared) error:', sharedRes.error.message);
    }

    const own = (ownRes.data ?? []).map(enrichPoint);
    const shared = (sharedRes.data ?? [])
      .map((row: any) => row.points)
      .filter(Boolean)
      .map(toMapPoint);

    // Fusion + dédup par id (un point créé par moi ne peut pas aussi m'être partagé, mais on sécurise).
    const byId = new Map<string, MapPoint>();
    for (const p of [...own, ...shared]) byId.set(p.id, p);
    setPoints([...byId.values()]);
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
    partnerIds?: string[];
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
      // Throw avec le vrai message Supabase pour affichage dans le snackbar
      throw new Error(`[${rpcError.code ?? 'ERR'}] ${rpcError.message ?? 'RPC failed'}`);
    }

    // Compatibilité migration 007 (RETURNS TABLE → array) et 008 (RETURNS UUID → string)
    let pointId: string | null = null;
    let rawPoint: any = null;

    if (typeof rpcData === 'string' && rpcData) {
      // Migration 008 : retourne directement l'UUID
      pointId = rpcData;
    } else if (Array.isArray(rpcData) && rpcData.length > 0) {
      // Migration 007 : retourne RETURNS TABLE → premier élément
      pointId = rpcData[0]?.id ?? null;
      rawPoint = rpcData[0] ?? null;
    } else if (rpcData && typeof rpcData === 'object' && !Array.isArray(rpcData)) {
      // Cas imprévu : objet scalar
      pointId = (rpcData as any).id ?? null;
      rawPoint = rpcData;
    }

    if (!pointId) {
      throw new Error(`ID manquant — type: ${typeof rpcData}, val: ${String(rpcData).slice(0, 60)}`);
    }

    // Récupérer le point complet si pas encore disponible (cas UUID pur)
    if (!rawPoint) {
      const { data: fetched, error: fetchError } = await supabase
        .from('points')
        .select('*')
        .eq('id', pointId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Fetch point: [${fetchError.code}] ${fetchError.message}`);
      }
      rawPoint = fetched;
    }

    if (!rawPoint) {
      throw new Error(`Point introuvable après création (id: ${pointId.slice(0, 8)}…)`);
    }

    // Garantir la présence des coordonnées (absentes dans RETURNS TABLE)
    if (!rawPoint.location) {
      rawPoint = {
        ...rawPoint,
        location: { type: 'Point', coordinates: [params.longitude, params.latitude] },
      };
    }

    const pointData = rawPoint;

    // Taguage partenaires (un ou plusieurs) — une ligne point_partners par partenaire.
    const partnerIds = params.partnerIds ?? [];
    if (partnerIds.length > 0) {
      const now = new Date().toISOString();
      const rows = partnerIds.map((pid) => ({
        point_id: pointId,
        partner_id: pid,
        status: 'pending',
        notified_at: now,
      }));

      const { error: partnerError } = await supabase.from('point_partners').insert(rows);

      if (partnerError) {
        console.error('[createPoint] Erreur taguage partenaires:', partnerError.message);
        // Ne bloque pas — le point est créé, le taguage a échoué
      } else {
        // Notification push à chaque partenaire mentionné disposant d'un push_token
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', params.userId)
          .single();

        const senderName =
          (creatorProfile as any)?.display_name ??
          (creatorProfile as any)?.username ??
          'Quelqu\'un';

        const { data: partnerProfiles } = await supabase
          .from('profiles')
          .select('id, push_token')
          .in('id', partnerIds);

        for (const pp of (partnerProfiles ?? [])) {
          const token = (pp as any).push_token;
          if (!token) continue;
          try {
            await fetch('https://exp.host/--/api/v2/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: token,
                title: 'LoveMap — Vous avez été mentionné',
                body: `${senderName} vous a mentionné sur un moment. Acceptez-vous ?`,
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

    setPoints((data ?? []).map(enrichPoint));
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

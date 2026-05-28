-- Migration 007 — Fonction RPC create_point
-- Evite les problèmes de format WKT côté client Supabase JS
-- Appelée via supabase.rpc('create_point', { ... }) depuis usePoints.ts

CREATE OR REPLACE FUNCTION create_point(
  p_creator_id UUID,
  p_longitude FLOAT,
  p_latitude FLOAT,
  p_note SMALLINT,
  p_comment TEXT DEFAULT NULL,
  p_duration_minutes SMALLINT DEFAULT NULL,
  p_happened_at TIMESTAMPTZ DEFAULT NOW(),
  p_address TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  creator_id UUID,
  note SMALLINT,
  comment TEXT,
  duration_minutes SMALLINT,
  is_visible BOOLEAN,
  happened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  address TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  INSERT INTO points (
    creator_id,
    location,
    note,
    comment,
    duration_minutes,
    is_visible,
    happened_at,
    address
  )
  VALUES (
    p_creator_id,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
    p_note,
    p_comment,
    p_duration_minutes,
    FALSE,
    p_happened_at,
    p_address
  )
  RETURNING
    id,
    creator_id,
    note,
    comment,
    duration_minutes,
    is_visible,
    happened_at,
    created_at,
    address;
END;
$$;

GRANT EXECUTE ON FUNCTION create_point TO authenticated;

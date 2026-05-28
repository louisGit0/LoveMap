-- Migration 008 — Fonction RPC create_point v2 (retourne UUID)
-- Remplace la v1 RETURNS TABLE par une version plus simple RETURNS UUID
-- Le client fetch ensuite le point complet via select

-- Supprimer l'ancienne signature RETURNS TABLE
DROP FUNCTION IF EXISTS create_point(UUID, FLOAT, FLOAT, SMALLINT, TEXT, SMALLINT, TIMESTAMPTZ, TEXT);

-- Nouvelle fonction RETURNS UUID
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
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_point_id UUID;
BEGIN
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
  RETURNING id INTO v_point_id;

  RETURN v_point_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_point TO authenticated;

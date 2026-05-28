-- Migration 009 — Colonnes manquantes + fonction create_point définitive
-- À appliquer dans : Supabase Dashboard > SQL Editor
-- Sûre à rejouer : toutes les opérations utilisent IF NOT EXISTS / CREATE OR REPLACE

-- ─────────────────────────────────────────────────────────────
-- 1. Colonnes manquantes sur points
-- ─────────────────────────────────────────────────────────────
ALTER TABLE points ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE points ADD COLUMN IF NOT EXISTS happened_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────
-- 2. Suppression de toutes les versions existantes de create_point
--    (gère RETURNS TABLE v1 et RETURNS UUID v2)
-- ─────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS create_point(UUID, double precision, double precision, smallint, text, smallint, timestamptz, text);
DROP FUNCTION IF EXISTS create_point(UUID, float, float, smallint, text, smallint, timestamptz, text);

-- ─────────────────────────────────────────────────────────────
-- 3. Fonction définitive RETURNS UUID
-- ─────────────────────────────────────────────────────────────
CREATE FUNCTION create_point(
  p_creator_id      UUID,
  p_longitude       FLOAT,
  p_latitude        FLOAT,
  p_note            SMALLINT,
  p_comment         TEXT        DEFAULT NULL,
  p_duration_minutes SMALLINT   DEFAULT NULL,
  p_happened_at     TIMESTAMPTZ DEFAULT NOW(),
  p_address         TEXT        DEFAULT NULL
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
    COALESCE(p_happened_at, NOW()),
    p_address
  )
  RETURNING id INTO v_point_id;

  RETURN v_point_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_point TO authenticated;

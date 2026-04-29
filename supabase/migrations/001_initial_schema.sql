-- ============================================================
-- LoveMap — Migration initiale
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Extension PostGIS
-- Activer d'abord dans : Dashboard > Database > Extensions > postgis
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. ENUM types
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected', 'blocked');
CREATE TYPE consent_status    AS ENUM ('pending', 'accepted', 'rejected');

-- ─────────────────────────────────────────────────────────────
-- TABLE : profiles
-- Liée 1:1 à auth.users via trigger
-- ─────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username         TEXT UNIQUE NOT NULL,
  display_name     TEXT NOT NULL,
  avatar_url       TEXT,
  date_of_birth    DATE NOT NULL,
  push_token       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE : points
-- ─────────────────────────────────────────────────────────────
CREATE TABLE points (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  location         GEOMETRY(Point, 4326) NOT NULL,
  note             SMALLINT NOT NULL CHECK (note >= 1 AND note <= 10),
  comment          TEXT,
  duration_minutes SMALLINT CHECK (duration_minutes > 0),
  is_visible       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX points_location_idx ON points USING GIST (location);
CREATE INDEX points_creator_idx  ON points (creator_id);

-- ─────────────────────────────────────────────────────────────
-- TABLE : point_partners
-- ─────────────────────────────────────────────────────────────
CREATE TABLE point_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id        UUID NOT NULL REFERENCES points(id) ON DELETE CASCADE,
  partner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status          consent_status NOT NULL DEFAULT 'pending',
  notified_at     TIMESTAMPTZ DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,
  UNIQUE (point_id, partner_id)
);

-- ─────────────────────────────────────────────────────────────
-- TABLE : friendships
-- ─────────────────────────────────────────────────────────────
CREATE TABLE friendships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        friendship_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

CREATE INDEX friendships_requester_idx ON friendships (requester_id);
CREATE INDEX friendships_addressee_idx ON friendships (addressee_id);

-- ─────────────────────────────────────────────────────────────
-- TRIGGER 1 : Création automatique du profil à l'inscription
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- TRIGGER 2 : Visibilité du point après consentement partenaire
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_point_visibility()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'accepted' THEN
    UPDATE points
    SET is_visible = TRUE, updated_at = NOW()
    WHERE id = NEW.point_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_partner_consent
  AFTER UPDATE ON point_partners
  FOR EACH ROW EXECUTE FUNCTION update_point_visibility();

-- ─────────────────────────────────────────────────────────────
-- RLS — Row Level Security
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE points         ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships    ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ──
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE status = 'accepted'
        AND (
          (requester_id = auth.uid() AND addressee_id = profiles.id)
          OR (addressee_id = auth.uid() AND requester_id = profiles.id)
        )
    )
  );

CREATE POLICY "profiles_insert" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- ── POINTS ──
CREATE POLICY "points_select" ON points FOR SELECT
  USING (
    creator_id = auth.uid()
    OR (
      is_visible = TRUE
      AND EXISTS (
        SELECT 1 FROM friendships
        WHERE status = 'accepted'
          AND (
            (requester_id = auth.uid() AND addressee_id = points.creator_id)
            OR (addressee_id = auth.uid() AND requester_id = points.creator_id)
          )
      )
    )
  );

CREATE POLICY "points_insert" ON points FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "points_update" ON points FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "points_delete" ON points FOR DELETE
  USING (creator_id = auth.uid());

-- ── POINT_PARTNERS ──
CREATE POLICY "point_partners_select" ON point_partners FOR SELECT
  USING (
    partner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM points
      WHERE points.id = point_partners.point_id
        AND points.creator_id = auth.uid()
    )
  );

CREATE POLICY "point_partners_insert" ON point_partners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM points
      WHERE points.id = point_partners.point_id
        AND points.creator_id = auth.uid()
    )
  );

CREATE POLICY "point_partners_update" ON point_partners FOR UPDATE
  USING (partner_id = auth.uid());

-- ── FRIENDSHIPS ──
CREATE POLICY "friendships_select" ON friendships FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friendships_insert" ON friendships FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "friendships_update" ON friendships FOR UPDATE
  USING (addressee_id = auth.uid());

CREATE POLICY "friendships_delete" ON friendships FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- Fonction utilitaire : recherche d'utilisateurs par username
-- Expose uniquement username + display_name (pas de date de naissance)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_users(query TEXT)
RETURNS TABLE (id UUID, username TEXT, display_name TEXT, avatar_url TEXT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT id, username, display_name, avatar_url
  FROM profiles
  WHERE username ILIKE '%' || query || '%'
    AND id <> auth.uid()
  LIMIT 20;
$$;

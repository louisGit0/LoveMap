-- Migration 011 — Corrige la récursion infinie RLS (42P17) sur la relation "points"
--
-- Cause :
--   La migration 010 a ajouté à la policy points_select une sous-requête sur point_partners :
--     EXISTS (SELECT 1 FROM point_partners WHERE point_partners.point_id = points.id ...)
--   Or point_partners_select (migration 001) contient déjà une sous-requête sur points :
--     EXISTS (SELECT 1 FROM points WHERE points.id = point_partners.point_id ...)
--   => points_select -> point_partners_select -> points_select -> ... (récursion infinie 42P17)
--   Symptôme : la création d'un point réussit (RPC create_point en SECURITY DEFINER),
--   mais le SELECT de relecture côté client échoue avec
--   « [42P17] infinite recursion detected in policy for relation "points" ».
--
-- Fix :
--   Déporter la vérification « partenaire en attente » dans une fonction SECURITY DEFINER
--   qui interroge point_partners en contournant la RLS. La policy points_select n'évalue
--   plus point_partners_select, ce qui brise le cycle dans les deux sens.
--
-- Sûre à rejouer : CREATE OR REPLACE FUNCTION + DROP POLICY IF EXISTS + CREATE POLICY.

CREATE OR REPLACE FUNCTION public.is_pending_partner(p_point_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM point_partners
    WHERE point_partners.point_id = p_point_id
      AND point_partners.partner_id = auth.uid()
      AND point_partners.status = 'pending'
  );
$$;

REVOKE ALL ON FUNCTION public.is_pending_partner(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_pending_partner(uuid) TO authenticated;

DROP POLICY IF EXISTS "points_select" ON points;

CREATE POLICY "points_select" ON points FOR SELECT
  USING (
    -- Le créateur voit toujours ses propres points
    creator_id = auth.uid()

    -- Les amis acceptés voient les points publics (is_visible=TRUE)
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

    -- Le partenaire tagué (pending) peut voir le point — via fonction SECURITY DEFINER
    -- pour éviter la récursion points <-> point_partners (42P17)
    OR public.is_pending_partner(points.id)
  );

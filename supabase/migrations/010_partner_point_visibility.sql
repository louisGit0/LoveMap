-- Migration 010 — Partenaire tagué peut voir le point en attente de consentement
-- Problème : RLS points_select bloquait le partenaire tagué (is_visible=FALSE)
--            → il ne pouvait ni voir la demande, ni consentir
-- Fix    : ajouter une clause permettant au partenaire tagué (status='pending')
--          de lire le point, même si is_visible=FALSE
-- Sûre à rejouer : DROP POLICY IF EXISTS + CREATE

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

    -- Le partenaire tagué (pending) peut voir le point pour consentir ou refuser
    OR EXISTS (
      SELECT 1 FROM point_partners
      WHERE point_partners.point_id = points.id
        AND point_partners.partner_id = auth.uid()
        AND point_partners.status = 'pending'
    )
  );

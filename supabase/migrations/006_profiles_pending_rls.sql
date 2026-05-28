-- Migration 006 : Élargissement de la politique RLS profiles_select
--
-- Problème : les profils des utilisateurs ayant envoyé une demande
-- d'amitié (status='pending') n'étaient pas lisibles par le destinataire
-- → join Supabase retournait null → UI affichait le compteur mais aucun item.
--
-- Fix : étendre la condition à status IN ('pending', 'accepted').

DROP POLICY IF EXISTS "profiles_select" ON profiles;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE status IN ('pending', 'accepted')
        AND (
          (requester_id = auth.uid() AND addressee_id = profiles.id)
          OR (addressee_id = auth.uid() AND requester_id = profiles.id)
        )
    )
  );

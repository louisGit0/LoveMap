-- Permet au partenaire tagué de modifier un point tant que son consentement est en attente
CREATE POLICY "points_update_partner" ON points FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM point_partners
      WHERE point_partners.point_id = points.id
        AND point_partners.partner_id = auth.uid()
        AND point_partners.status = 'pending'
    )
  );

-- Table pour stocker les photos associées aux points
CREATE TABLE point_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  point_id   UUID NOT NULL REFERENCES points(id) ON DELETE CASCADE,
  photo_url  TEXT NOT NULL,
  position   SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE point_photos ENABLE ROW LEVEL SECURITY;

-- Lecture : même visibilité que le point associé
CREATE POLICY "point_photos_select" ON point_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM points WHERE points.id = point_photos.point_id
        AND (
          points.creator_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM point_partners
            WHERE point_partners.point_id = points.id
              AND point_partners.partner_id = auth.uid()
          )
          OR (points.is_visible = TRUE AND EXISTS (
            SELECT 1 FROM friendships WHERE status = 'accepted'
              AND ((requester_id = auth.uid() AND addressee_id = points.creator_id)
                OR (addressee_id = auth.uid() AND requester_id = points.creator_id))
          ))
        )
    )
  );

-- Insertion : seul le créateur du point peut ajouter des photos
CREATE POLICY "point_photos_insert" ON point_photos FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM points WHERE points.id = point_photos.point_id AND points.creator_id = auth.uid())
  );

-- Suppression : seul le créateur du point peut supprimer des photos
CREATE POLICY "point_photos_delete" ON point_photos FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM points WHERE points.id = point_photos.point_id AND points.creator_id = auth.uid())
  );

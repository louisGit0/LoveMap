-- ============================================================
-- LoveMap — Migration 002
-- Table messages + fonction accept_point_as_partner
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- TABLE : messages
-- ─────────────────────────────────────────────────────────────
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 1000),
  read_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX messages_sender_idx      ON messages (sender_id);
CREATE INDEX messages_recipient_idx   ON messages (recipient_id);
CREATE INDEX messages_conversation_idx ON messages (
  LEAST(sender_id, recipient_id),
  GREATEST(sender_id, recipient_id)
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Un utilisateur ne voit que ses propres messages (envoyés ou reçus)
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- On ne peut envoyer qu'en son propre nom
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- On peut marquer comme lu uniquement ses messages reçus
CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (recipient_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- FONCTION : accept_point_as_partner
-- Permet au partenaire tagué de modifier le point et d'accepter
-- le taguage en une seule transaction sécurisée.
-- Le trigger on_partner_consent passe ensuite is_visible à TRUE.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION accept_point_as_partner(
  p_point_id    UUID,
  p_new_note    SMALLINT DEFAULT NULL,
  p_new_comment TEXT     DEFAULT NULL,
  p_new_duration SMALLINT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_partner_record_id UUID;
BEGIN
  -- Vérifier que l'appelant est bien un partenaire en attente sur ce point
  SELECT id INTO v_partner_record_id
  FROM point_partners
  WHERE point_id  = p_point_id
    AND partner_id = auth.uid()
    AND status     = 'pending';

  IF v_partner_record_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Mettre à jour le point si des valeurs modifiées sont fournies
  IF p_new_note IS NOT NULL OR p_new_comment IS NOT NULL OR p_new_duration IS NOT NULL THEN
    UPDATE points
    SET
      note             = COALESCE(p_new_note,     note),
      comment          = COALESCE(p_new_comment,  comment),
      duration_minutes = COALESCE(p_new_duration, duration_minutes),
      updated_at       = NOW()
    WHERE id = p_point_id;
  END IF;

  -- Accepter le taguage — déclenche le trigger on_partner_consent
  -- qui passe is_visible = TRUE sur le point
  UPDATE point_partners
  SET status       = 'accepted',
      responded_at = NOW()
  WHERE id = v_partner_record_id;

  RETURN TRUE;
END;
$$;

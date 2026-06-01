-- Migration 012 — Politiques RLS Storage pour le bucket avatars
--
-- Problème : `storage.objects` a RLS activé (défaut Supabase) mais AUCUNE policy
--            (policy_count = 0) → tout upload est refusé avec
--            « new row violates row-level security policy », même si le bucket
--            `avatars` est `public`. Un bucket public n'autorise que la LECTURE
--            via le CDN ; l'ÉCRITURE (INSERT dans storage.objects) exige une policy.
--   Symptôme : upload de la photo de profil échoue (visible une fois le crash
--   expo-image-picker corrigé en build #18).
--
-- Fix : autoriser l'utilisateur authentifié à écrire UNIQUEMENT son propre avatar
--       (fichier nommé `<uid>.<ext>`, cf. profile/index.tsx), + lecture publique.
--
-- Sûre à rejouer : DROP POLICY IF EXISTS + CREATE.

-- Upload (INSERT) : seul un fichier préfixé par l'uid de l'utilisateur
DROP POLICY IF EXISTS "avatars_insert_own" ON storage.objects;
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '.', 1) = auth.uid()::text
  );

-- Remplacement (UPDATE) — nécessaire car l'upload utilise `upsert: true`
DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND split_part(name, '.', 1) = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND split_part(name, '.', 1) = auth.uid()::text
  );

-- Lecture publique du bucket avatars (bucket déjà public ; supporte l'affichage)
DROP POLICY IF EXISTS "avatars_select_public" ON storage.objects;
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Migration 005 — Validation de l'âge côté serveur
-- Protège contre le contournement du age gate client
-- À exécuter dans : Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  dob DATE;
  age_years INT;
BEGIN
  -- Récupère la date de naissance transmise via raw_user_meta_data
  dob := (NEW.raw_user_meta_data->>'date_of_birth')::DATE;

  -- Calcul de l'âge
  age_years := DATE_PART('year', AGE(dob));

  -- Blocage serveur si mineur — empêche la création du profil
  IF age_years < 18 THEN
    RAISE EXCEPTION 'Accès interdit : vous devez avoir 18 ans pour vous inscrire sur LoveMap.';
  END IF;

  -- Création du profil uniquement si majeur
  INSERT INTO profiles (id, username, display_name, date_of_birth)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    dob
  );

  RETURN NEW;
END;
$$;

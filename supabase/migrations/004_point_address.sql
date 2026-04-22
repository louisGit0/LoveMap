-- Ajout de la colonne adresse pour stocker le résultat du reverse geocoding
ALTER TABLE points ADD COLUMN address TEXT;

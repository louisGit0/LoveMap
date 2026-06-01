# Checklist de validation STAB — builds TestFlight actuels (#15 / #16)

**À exécuter sur les builds TestFlight ACTUELS, AVANT le build #17.**

- STAB-01 (photo de profil) se teste sur le **build #15**.
- STAB-02 (pins au dézoom) et STAB-03 (mention partenaire) se testent sur le **build #16**.

Ces trois vérifications confirment que les corrections des builds #15/#16 tiennent toujours. Conformément à la séquence stricte D-07, on valide ces corrections AVANT de produire le build #17 qui embarque les fondations natives (reanimated, gesture-handler, runtimeVersion fingerprint). On ne mélange pas la vérification de bugs existants avec l'introduction de nouveau code natif.

Validation manuelle uniquement (D-08) : aucun test automatisé. Cocher chaque item qui passe, et décrire toute anomalie dans le champ prévu.

---

## STAB-01 — Photo de profil sans crash (build #15)

Étapes :

1. Ouvrir LoveMap (build #15) installé depuis TestFlight.
2. Aller dans l'onglet Profil (« Moi »).
3. Taper sur la photo / l'avatar.
4. La galerie iOS s'ouvre **sans crash**.
5. Sélectionner une image.
6. L'avatar se met à jour avec l'image choisie.

Résultat attendu : la galerie s'ouvre sans planter et l'avatar reflète la nouvelle image.

- [ ] STAB-01 PASS — EN ATTENTE du build #17 (correctif client, OTA inopérant)
- Anomalie observée : Crash dès le clic sur l'avatar.
- Correctif appliqué (code) : `expo-file-system` → API legacy (SDK 54 a déplacé `readAsStringAsync`/`EncodingType` vers `expo-file-system/legacy`). À valider sur le build #17. Si un crash natif du picker subsiste, fournir le log de crash device.

---

## STAB-02 — Pins visibles à tous les niveaux de dézoom (build #16)

Étapes :

1. Ouvrir LoveMap (build #16) installé depuis TestFlight.
2. Afficher la carte avec au moins 1 point existant.
3. Dézoomer progressivement jusqu'au niveau maximum.
4. Observer les pins à chaque niveau de zoom.

Résultat attendu : les pins restent visibles à tous les niveaux de dézoom (aucun pin ne disparaît au dézoom).

- [X] STAB-02 PASS (re-testé sur #16 après correctif serveur)
- Anomalie initiale (RÉSOLUE) : erreur au clic sur « sceller » — cause = récursion RLS `42P17` sur `points` (introduite par migration 010). Corrigée par migration 011 (fonction `SECURITY DEFINER is_pending_partner`). Re-test #16 : création de point OK, pins visibles au dézoom.

---

## STAB-03 — Mention partenaire visible et consentable (build #16)

Note : ce scénario nécessite **2 comptes** (testeur 1 et testeur 2). À défaut, valider en best-effort avec les moyens disponibles.

Étapes :

1. Avec le **testeur 1**, créer un point en taguant le **testeur 2** comme partenaire.
2. Avec le **testeur 2**, ouvrir l'onglet Cercle.
3. Aller dans Demandes.
4. La section « Taguages » affiche le point créé par le testeur 1.
5. Le testeur 2 peut **Sceller** (accepter) ou **Refuser** le taguage.

Résultat attendu : le taguage en attente est visible côté testeur 2, qui peut le sceller ou le refuser.

- [X] STAB-03 PASS (re-testé sur #16 après correctif serveur)
- Anomalie initiale (RÉSOLUE) : même cause (récursion RLS `42P17`), corrigée par migration 011. Création + taguage partenaire fonctionnels sur #16.

---

## Verdict global

- [X] STAB-02 + STAB-03 corrigés (migration 011) et re-validés sur #16. STAB-01 corrigé en code (expo-file-system legacy) — validation finale sur le build #17.
- Verdict initial : « Au moins un item échoue » → les correctifs ont été appliqués. Le build #17 est produit avec le correctif avatar + les fondations natives ; STAB-01 sera validé dessus.

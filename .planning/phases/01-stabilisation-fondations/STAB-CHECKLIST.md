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

- [X] STAB-01 PASS — validé sur #18 (« Ça marche » : galerie s'ouvre, photo uploadée, avatar mis à jour)
- Anomalie observée : « Impossible d'ouvrir la galerie » puis crash, au clic sur l'avatar (toujours présent sur #17).
- **Cause racine (confirmée)** : `expo-image-picker` épinglé en **16.0.6** alors que SDK 54 attend **17.0.11** → mismatch d'interface JS/natif → `launchImageLibraryAsync` rejette et l'app crashe. Présent depuis #15.
- Correctifs appliqués : (1) `expo-image-picker` 16.0.6 → 17.0.11 (correctif racine du crash) ; (2) `expo-file-system` → API legacy (lecture base64) ; (3) message d'erreur réel surfacé dans le catch ; (4) **migration 012** — policies RLS Storage sur le bucket `avatars` (storage.objects avait RLS sans aucune policy → upload refusé « new row violates RLS »). Correctif serveur live.
- Statut #18 : crash RÉSOLU (galerie s'ouvre). Upload débloqué par migration 012 (serveur, sans rebuild). À re-tester sur #18 : la photo doit se sauvegarder et l'avatar se mettre à jour.

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

- [X] **Les 3 items STAB passent.** STAB-02/03 corrigés par migration 011 (RLS 42P17), validés sur #16. STAB-01 corrigé par expo-image-picker 17.0.11 (#18) + migration 012 (RLS Storage avatars), validé sur #18.
- Parcours : verdict initial « échec » → diagnostic + correctifs (2 migrations serveur + 1 upgrade natif + 1 API legacy) → tous validés device/serveur. La phase Stabilisation a rempli son rôle : les régressions #15/#16 ont été isolées et corrigées avant la suite de la refonte.

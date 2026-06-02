# Checklist device — Validation Phase 5 (Auth, Profil & Finitions) — DERNIÈRE PHASE

> À valider sur **build #29** (TestFlight, iOS 26), en thème **clair ET sombre**.

---

## UI-01 — Auth « page de couverture »

1. **Connexion** : en-tête éditorial (eyebrow « LOVEMAP · ÉDITION INTIME » + grand titre serif « LoveMap »), champs **e-mail / mot de passe visibles immédiatement** (soulignés), un seul CTA « Se connecter », erreurs en Snackbar.
2. **Inscription step 1 (âge)** : page de garde solennelle (eyebrow « VÉRIFICATION D'ÂGE » + « Quel âge avez-vous ? »), CTA « **Vérifier mon âge** ». **Saisir < 18 ans bloque** (retour haptique) ; ≥ 18 passe au step 2.
3. **Inscription step 2** : formulaire cohérent avec le login ; l'inscription complète crée bien un compte.

- [ ] UI-01 PASS — Anomalie : __________________________________________

## UI-08 — Profil « page de couverture »

1. En-tête : avatar **carré 80px**, nom en grand serif, @pseudo en mono.
2. **Avatar : choisir une photo ouvre la galerie et l'upload fonctionne SANS crash** (non-régression critique — onglet « Moi »).
3. Section **Analyse en bento** : grande tuile = **nombre de moments** (« PAGES DU CARNET ») en gros chiffre, + durée totale, mois actifs, distribution des notes (barres monochromes + rose).
4. **Un seul** toggle de thème (IcoSun/IcoMoon) — plus de double interrupteur ; VoiceOver l'annonce.
5. Changer e-mail / mot de passe fonctionne. **Suppression de compte = Alert native seule** (« Supprimer le compte ? » + bouton rouge) — plus de champ « EFFACER » à taper.

- [ ] UI-08 PASS — Anomalie : __________________________________________

## IOS-04 — Finitions transverses (9 écrans)

1. **Home indicator** : sur login/register (plein écran) et les listes, le contenu ne passe pas sous la barre d'accueil (padding bas = insets).
2. **Dynamic Type** : Réglages iOS → Accessibilité → grande taille de texte → parcourir les 9 écrans : **pas de casse de layout** (les gros titres serif sont plafonnés, le corps grossit raisonnablement).
3. **Cohérence clair + sombre** sur les 9 écrans (carte, création, détail, liste, cercle, demandes, login, register, profil).

- [ ] IOS-04 PASS — Anomalie : __________________________________________

---

## Verdict global Phase 5 (et milestone v1.0)

- [ ] UI-01 + UI-08 + IOS-04 passent sur device #29, clair + sombre, Dynamic Type → **Phase 5 validée → milestone Refonte UI/UX iOS TERMINÉ (22/22)**.
- [ ] Au moins un échoue → décrire l'anomalie (correctif + rebuild avant clôture).

> Non-régression la plus critique à confirmer : **l'upload d'avatar** (historique de crashes #8/#11/#13). Tester en priorité.

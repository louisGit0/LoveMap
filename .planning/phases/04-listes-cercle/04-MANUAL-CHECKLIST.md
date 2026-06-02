# Checklist device — Validation Phase 4 (Listes & Cercle)

> À valider sur **build #28** (TestFlight, iOS 26), en thème **clair ET sombre**.
> Cocher chaque ligne qui passe ; décrire toute anomalie.

---

## UI-05 — Liste « table des matières » (onglet Carnet / liste des moments)

1. Chaque ligne affiche la **note /10 en gros chiffre serif** à gauche (pas de N°001), métadonnées (lieu/commentaire + date) à droite, filet de séparation.
2. La liste est **groupée par mois** avec un header « JUIN 2026 » (eyebrow mono) qui **reste collé en haut** au scroll (sticky).
3. **Filtres en pills inline** en haut : note min (Toutes / 5+ / 7+ / 9+) et tri (Date / Note). La pill active est rose. « 9+ » → seules les notes ≥ 9 ; tri « Note » → tri par note dans le mois.
4. **Pull-to-refresh**, skeleton au chargement, et snackbar si erreur réseau fonctionnent toujours. Plus aucun bouton qui ouvrait une feuille de filtres.
5. État vide : « Le carnet est vide. » + « Posez votre premier moment sur la carte. »

- [ ] UI-05 PASS — Anomalie : __________________________________________

## UI-06 — « Le cercle » (onglet Amis)

1. Titre « **Le cercle** » en grand serif. Recherche en champ **souligné** (underline).
2. Chaque ami = avatar **carré** (initiale serif italic rose), nom en serif, @pseudo en mono à droite, action « **Carte** » en lien souligné.
3. « Carte » ouvre la carte en **vue de cet ami**.
4. Action « **Retirer** » (texte rouge) → alerte « **Retirer du cercle ?** » → confirmer → l'ami **disparaît** + snackbar « Retiré du cercle. » + retour haptique ; annuler garde l'ami.
5. États vides : « Votre cercle est vide. » / « Cherchez un nom pour inviter quelqu'un. » / « Aucun nom ne correspond. »

- [ ] UI-06 PASS — Anomalie : __________________________________________

## UI-07 — Demandes

1. Deux sections à eyebrow mono : « **Demandes reçues** » et « **Taguages en attente** », plus une 3e section discrète « **Envoyées** ».
2. Demande d'amitié : **Accepter** (rose) / **Refuser** (gris) en boutons texte → snackbar + haptique (refus = warn).
3. Taguage en attente : **Sceller** / **Décliner** en boutons texte **directement sur la ligne** (plus besoin d'ouvrir le détail du point) → « Page scellée. » / « Taguage refusé. »
4. État vide global : « Pas de page en attente. » ; une section vide est masquée.

- [ ] UI-07 PASS — Anomalie : __________________________________________

---

## Verdict global Phase 4

- [ ] Les 3 requirements (UI-05/06/07) passent sur device #28, thèmes clair + sombre → Phase 4 validée.
- [ ] Au moins un échoue → décrire l'anomalie (correctif + rebuild avant clôture).

> Notes connues à regarder : les lignes de **taguage** n'ont pas d'avatar/nom du tagueur (le modèle `PendingTag` ne le porte pas) → la ligne s'ancre sur la note + libellé + date, boutons à droite ; vérifier la troncature sur petit écran.

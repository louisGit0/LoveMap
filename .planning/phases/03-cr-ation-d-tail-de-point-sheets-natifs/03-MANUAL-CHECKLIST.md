# Checklist device — Validation Phase 3 (sheets natifs création/détail)

> **À valider sur device physique / TestFlight (build #20), PAS sur simulateur** — les sheets natifs, gestes et clavier diffèrent du simulateur (surtout iOS 26).

Cocher chaque ligne qui passe ; décrire toute anomalie.

---

## IOS-01 — Bottom sheets natifs (création + détail)

1. Taper le **FAB** sur la carte (ou long-press) → la **création** s'ouvre en **sheet natif** qui glisse du bas (poignée en haut, coins arrondis iOS, occupe ~90 % de l'écran).
2. **Swipe vers le bas** ferme le sheet.
3. Taper un pin → le **détail** s'ouvre de la même façon (sheet natif).

- [ ] IOS-01 PASS — Anomalie : __________________________________________

## IOS-02 — Tap-pin direct + gestes natifs

1. Taper un pin → ouvre **directement** la page de détail (plus de petite Modal d'aperçu intermédiaire).
2. Fermer par swipe, **re-taper le même pin** → le détail se rouvre bien (pas de pin « bloqué »).
3. Les pins restent visibles à **tous les zooms** (garde STAB-02, Phase 2).

- [ ] IOS-02 PASS — Anomalie : __________________________________________

## D-04 — Confirmation de fermeture (création)

1. En création, saisir quelque chose (changer la note, écrire un commentaire, choisir un partenaire).
2. **Swipe vers le bas** pour fermer → alerte « **Abandonner ce moment ?** » (Continuer l'écriture / Abandonner).
3. Sans aucune saisie → le swipe ferme directement (pas d'alerte).
   - *Note connue : taper le voile gris au-dessus du sheet ferme sans confirmation (edge-case accepté).*

- [ ] D-04 PASS — Anomalie : __________________________________________

## UI-03 — Page de carnet « création »

1. La **note** est en tête, en gros chiffre serif (le geste central), avec la barre de 10 segments.
2. En dessous : commentaire, partenaire, durée, date, lieu.
3. Le clavier ne casse pas la mise en page (le champ reste visible, ça scrolle ; le sheet ne s'effondre pas).
4. CTA « **Sceller la page** » crée le point (partenaire obligatoire respecté).

- [ ] UI-03 PASS — Anomalie : __________________________________________

## UI-04 — Page de carnet « détail » (lecture)

1. La note s'affiche en grand (lecture), le commentaire en **pull-quote** italic entre guillemets «», métadonnées en mono.
2. Le **consentement** (sceller / refuser) fonctionne ; la **suppression** (« Effacer cette page », en rouge) fonctionne depuis le détail.
3. En **mode édition**, la date se saisit en **segments JJ/MM/AAAA** (plus de calendrier modal) → **aucun gel/freeze** de l'app.

- [ ] UI-04 PASS — Anomalie : __________________________________________

---

## Verdict global Phase 3

- [ ] Les 4 requirements (IOS-01/02, UI-03/04) passent sur device #20 → Phase 3 validée.
- [ ] Au moins un échoue → décrire l'anomalie (correctif + rebuild avant clôture).

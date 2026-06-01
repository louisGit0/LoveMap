# Checklist device — Validation visuelle Phase 2 (Carte stylisée)

> **À valider sur device physique / TestFlight, PAS sur simulateur** — le rendu GPU Mapbox (heatmap, style) diffère du simulateur (RESEARCH Pitfall 5). Tester en mode sombre ET clair là où c'est pertinent.

Cocher chaque ligne qui passe ; décrire toute anomalie.

---

## MAP-01 — Style Mapbox sur-mesure (checkpoint humain, plan 02-05)

1. Ouvrir la carte.
2. Le fond est anthracite quasi-noir (pas le `dark-v11` générique).
3. Touches rose désaturées visibles (eau / grands axes) — subtiles, pas criardes.
4. Labels minimalistes : villes / quartiers / grandes artères conservés ; POI, rues mineures, transit, numéros RETIRÉS.

- [ ] MAP-01 PASS — Anomalie : __________________________________________

## MAP-02 — Heatmap rose→ambre (plan 02-02)

1. Basculer le toggle sur **Heatmap**.
2. Le dégradé va du rose froid (périphérie) à l'ambre/or chaud (zones où les moments se superposent) — effet « braise ».
3. Aucune teinte rose globale de la carte (premier stop transparent OK).
4. Zoomer de près → l'opacité décroît en **lueur douce** (la carte reste visible dessous), pas un aplat ni une disparition totale.

- [ ] MAP-02 PASS — Anomalie : __________________________________________

## MAP-03 — Markers raffinés + sélection + apparition (plan 02-03)

1. **Garde régression STAB-02** : les pins restent visibles à **TOUS les niveaux de zoom** (dézoom maximum inclus).
2. Pin au repos raffiné (tête ronde bord rose + tige + halo léger).
3. Tap sur un pin → **agrandissement + halo rose** immédiat (re-snapshot), puis la preview s'ouvre.
4. Au chargement de la carte → les pins apparaissent en **cascade** (staggered) ; la preview ne clignote jamais sans pins.

- [ ] MAP-03 PASS — Anomalie : __________________________________________

## UI-02 — Contrôles + FAB (plans 02-03 + 02-04)

1. Le **FAB** est un **squircle** (coins arrondis iOS, ni carré ni cercle Material) ; au tap → micro-scale + **haptique medium**.
2. Le **bandeau de contrôles** est une carte flottante lisible (surface semi-opaque, **pas de blur lourd**, texte net) aux coins arrondis continus.
3. Le **toggle Points / Heatmap** fonctionne, segment actif rose, **haptique** au changement.
4. Le **sélecteur d'ami** (pill arrondi) et le **bouton Recentrer** (bas-droite, arrondi) ont un retour haptique.

- [ ] UI-02 PASS — Anomalie : __________________________________________

---

## Verdict global Phase 2

- [ ] Les 4 requirements visuels passent sur device → Phase 2 validée.
- [ ] Au moins un échoue → décrire l'anomalie ci-dessus (correctif avant clôture).

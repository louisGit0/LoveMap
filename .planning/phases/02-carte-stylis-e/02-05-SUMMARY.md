---
phase: 02-carte-stylis-e
plan: 05
status: complete
requirements: [MAP-01]
---

# Summary 02-05 — Style Mapbox sur-mesure (MAP-01)

## Objective atteint

Le style Mapbox sur-mesure noir/rose est créé (checkpoint humain), injecté et validé sur device. La carte affiche la signature visuelle de l'app au lieu du `dark-v11` générique.

## Ce qui a été fait

### Task 1 — checklist device (autonome)
- `02-MANUAL-CHECKLIST.md` créée : 1 ligne cochable par requirement (MAP-01/02/03 + UI-02) + garde STAB-02 (pins à tous les zooms) + note device-only (Pitfall 5).

### Task 2 — checkpoint humain (style Studio + injection + device)
- **Style fourni** : Claude a généré un style Mapbox GL complet (`lovemap-noir-rose.style.json`, 29 calques) reproduisant la recette UI-SPEC, puis enrichi à la demande de l'utilisateur (« plus de vie ») : relief hillshade, parcs verts, eau rose-prune + rive, halo rose sur les autoroutes, bâtiments 3D (fill-extrusion), pastilles POI roses, transit, plus de labels (pays/régions/villes/quartiers).
- **Utilisateur** : a uploadé le JSON dans Mapbox Studio, publié → URL `mapbox://styles/eloso/cmpvltt03000k01sgg9b65z4l`.
- **Injection** : `EXPO_PUBLIC_MAPBOX_STYLE` posée dans `.env.local` ET créée dans l'env EAS production (plaintext). Le token public `pk.*` existant (eloso) charge le style privé — inchangé.
- **Livraison** : **build EAS #19** (code Phase 2 complet + style custom). Le log confirme `EXPO_PUBLIC_MAPBOX_STYLE` chargé dans le bundle. Submit TestFlight OK.
- **Validation device** : utilisateur sur build #19 → « Validé » (style custom rendu : anthracite, eau rose-prune, parcs verts, relief, halo rose, POI).

## Déviation assumée (visionnaire)

La décision D-01 « labels minimalistes » a été enrichie à la demande explicite de l'utilisateur vers « plus de détails et plus de vie » (29 calques vs 14). L'identité sombre noir/rose (D-02/D-03) est conservée ; la densité de labels/contenu est augmentée. Évolution de direction visuelle, pas un scope creep produit.

## Vérification

- `EXPO_PUBLIC_MAPBOX_STYLE` présent dans `.env.local` + env EAS ; build #19 a bundlé la valeur (log).
- Style JSON valide (version 8, 29 calques, sources composite + mapbox-dem) — versionné dans `.planning/phases/02-carte-stylis-e/lovemap-noir-rose.style.json`.
- Rendu device conforme (checklist MAP-01 cochée).

## Self-Check: PASSED

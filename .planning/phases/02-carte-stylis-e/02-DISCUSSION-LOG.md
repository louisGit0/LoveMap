# Phase 2: Carte stylisée - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-01
**Phase:** 2-carte-stylis-e
**Areas discussed:** Style Mapbox (MAP-01), Markers (MAP-03), Heatmap (MAP-02), Contrôles + FAB (UI-02)

---

## Style Mapbox (MAP-01)

| Question | Options | Choix |
|----------|---------|-------|
| Rôle visuel de la carte | Décor quasi-noir labels minimaux · **Sombre mais lisible** · You decide | Sombre mais lisible |
| Rose sur la carte | Réservé points/heatmap · **Touches rose subtiles** · You decide | Touches rose subtiles |
| Teinte de fond | **Anthracite quasi-noir** · Bleu nuit #0d1a2e · You decide | Anthracite quasi-noir |
| Production du style | **Je fournis spec, tu crées dans Studio** · Base sombre maintenant · Je m'en occupe | Spec Claude → Studio utilisateur → URL |

---

## Markers (MAP-03)

| Question | Options | Choix |
|----------|---------|-------|
| Direction visuelle | **Raffiner le pin actuel** · Point lumineux/braise · Marker avec note · You decide | Raffiner le pin actuel |
| État sélectionné | **Agrandissement + halo rose** · Tête pleine inversée · Les deux · You decide | Agrandissement + halo rose |
| Animation d'apparition | **Pop/scale-up cascade** · Drop-in rebond · Fondu simple · You decide | Pop/scale-up en cascade (fondu en repli) |

---

## Heatmap (MAP-02)

| Question | Options | Choix |
|----------|---------|-------|
| Sens du dégradé | **Ambre = forte concentration** · Ambre = intensité des notes · You decide | Ambre = forte concentration |
| Opacité au zoom proche | **S'atténue en lueur douce** · Quasi-disparaît au zoom max · You decide | Lueur douce |

---

## Contrôles + FAB (UI-02)

| Question | Options | Choix |
|----------|---------|-------|
| Ampleur refonte contrôles | Raffiner l'existant + haptics · **Repenser en bandeau éditorial** · You decide | Bandeau éditorial signature |
| Forme du FAB | Carré rose raffiné · Bouton à label · You decide · **(Other)** | « Fini le carré, plus iOS-friendly » → pivot design |
| Portée du pivot iOS (plain text) | 1 FAB seul · 2 contrôles carte · **3 toute la refonte + révision design system** | 3 — toute la refonte (Phases 2→5) |

**Notes :** la réponse « Other » sur la forme du FAB a déclenché une décision transversale (D-12) : abandon des angles francs au profit de formes iOS arrondies (squircle) sur tout le cap, révision du design system (theme.ts radius + CLAUDE.md). Forme exacte du FAB et échelle de rayons à figer en UI-SPEC.

---

## Claude's Discretion

- Hex exacts du dégradé heatmap + courbe d'opacité par zoom.
- Détails de la spec Mapbox Studio (hex par calque).
- Mapping haptique fin des contrôles secondaires (toggle, recentrer).
- Forme FAB rond vs squircle + échelle de rayons iOS (proposés en UI-SPEC).

## Deferred Ideas

- Clustering au dézoom (MAP-V2-01, v2).
- Preview marker en bottom sheet natif (Phase 3, IOS-01).
- Verrouillage du langage iOS arrondi → UI-SPEC `/gsd:ui-phase 2`.

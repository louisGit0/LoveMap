---
phase: 2
slug: carte-stylis-e
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Reality (verified by research):** ce projet n'a AUCUN framework de test automatisé (pas de jest/jest-expo). La validation = gates statiques + checklist manuelle TestFlight (device-only). La plupart des livrables visuels carte ne sont vérifiables que sur device.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — pas de runner de tests (projet device-validated) |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` (aucune NOUVELLE erreur vs baseline ~38) |
| **Full suite command** | `npx tsc --noEmit && npx eslint .` |
| **Estimated runtime** | ~30–60 s (tsc) |

---

## Sampling Rate

- **After every task commit:** `npx tsc --noEmit` — confirmer 0 nouvelle erreur attribuable au fichier touché.
- **After every plan wave:** `npx tsc --noEmit && npx eslint .` (gates statiques).
- **Before `/gsd:verify-work`:** gates statiques verts + checklist device cochée.
- **Max feedback latency:** ~60 s (statique). Validation visuelle = manuelle (device).

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| (rempli par le planner) | — | — | MAP-01/02/03 · UI-02 | — | N/A (présentation) | static + manual | `npx tsc --noEmit` | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements (gates statiques tsc/eslint déjà en place — aucune install de framework requise).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Style Mapbox sur-mesure rendu | MAP-01 | URL Studio créée par l'utilisateur ; rendu visuel device | Injecter l'URL dans `EXPO_PUBLIC_MAPBOX_STYLE`, rebundle/OTA, ouvrir la carte → fond anthracite + touches rose désaturées + labels minimaux |
| Heatmap rose→ambre + falloff | MAP-02 | Rendu GPU device, par-zoom | Mode heatmap, zoomer/dézoomer → dégradé braise, opacité décroît en lueur douce au zoom proche |
| Marker raffiné + sélection + apparition | MAP-03 | Rendu natif PointAnnotation device | Pins visibles tous zooms ; tap → agrandissement + halo (refresh) ; au chargement → cascade staggered |
| Bandeau + FAB squircle + haptics | UI-02 | Formes iOS + haptique device | FAB squircle (pas carré), tap → haptic press + micro-anim ; bandeau lisible (pas de blur lourd) |

---

## Validation Sign-Off

- [ ] Tous les tasks ont un gate statique (`tsc`/`eslint`) ou une vérif manuelle device documentée
- [ ] Pas de 3 tasks consécutifs sans aucune vérification (statique OU manuelle)
- [ ] Checklist device complète pour MAP-01/02/03 + UI-02
- [ ] Aucun flag watch-mode
- [ ] `nyquist_compliant: true` posé après revue planner

**Approval:** pending

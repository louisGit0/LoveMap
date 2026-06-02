# Phase 5: Auth, Profil & Finitions - Discussion Log

> **Audit trail only.** Decisions are captured in CONTEXT.md.

**Date:** 2026-06-02
**Phase:** 5-Auth, Profil & Finitions
**Areas discussed:** Login, Bento profil, Dynamic Type, Finitions

---

## Login — composition

| Option | Description | Selected |
|--------|-------------|----------|
| Couverture héro | Titre serif + eyebrow en haut, champs sous la ligne de flottaison | |
| En-tête compact + champs visibles | En-tête éditorial ramassé, champs email/mdp immédiatement visibles | ✓ |

**User's choice:** En-tête compact + champs visibles
**Notes:** Garde le ton couverture mais sans scroll pour atteindre les champs.

---

## Bento profil — grande tuile

| Option | Description | Selected |
|--------|-------------|----------|
| Durée totale cumulée | Somme des durées, gros serif | |
| Nombre de moments | Total de moments scellés, gros serif (« pages du carnet ») | ✓ |
| Note moyenne | Note moyenne /10, gros serif | |

**User's choice:** Nombre de moments

---

## Dynamic Type (IOS-04)

| Option | Description | Selected |
|--------|-------------|----------|
| Support avec plafonds | allowFontScaling + maxFontSizeMultiplier (accessibilité sans casse) | ✓ |
| Tailles fixes | allowFontScaling:false (layout garanti, moins accessible) | |

**User's choice:** Support avec plafonds

---

## Finitions — périmètre

| Option | Description | Selected |
|--------|-------------|----------|
| Audit ciblé + correctifs | Auditer safe areas/home indicator/Dynamic Type + corriger les casses | |
| + sweep de cohérence | En plus : aligner espacements/typo sur les tokens sur les 9 écrans | ✓ |

**User's choice:** + sweep de cohérence
**Notes:** Passe plus complète sur les 9 écrans (clair + sombre).

## Claude's Discretion

- Plafonds exacts maxFontSizeMultiplier par rôle.
- Disposition précise des tuiles bento.
- Liste fine des écrans touchés par le sweep (selon l'audit).

## Deferred Ideas

- Nouveau flux d'auth / social login / onboarding multi-slides (anti-features).
- Nouvelles métriques d'analyse au-delà de l'existant.

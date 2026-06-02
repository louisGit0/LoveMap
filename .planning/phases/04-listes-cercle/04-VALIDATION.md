---
phase: 4
slug: listes-cercle
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-02
---

# Phase 4 — Validation Strategy

> Per-phase validation contract. **No automated test framework exists** in this project (no jest/vitest/playwright in `package.json`) — validation = static gates + a manual TestFlight checklist. This is the established project standard (Phases 1-3) and sufficient for a presentation-layer redesign.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — static analysis + manual device validation |
| **Config file** | `tsconfig.json` (strict) ; ESLint via `eslint-config-expo` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit` (+ `npx expo lint` where configured) |
| **Baseline** | ~36 pre-existing tsc errors (Supabase `never` types). Gate = **0 NEW errors** over baseline. Capture fresh count at Wave 0. |

---

## Sampling Rate

- **After every task commit:** `npx tsc --noEmit` → 0 new errors over baseline.
- **After every screen (plan) completes:** static suite green.
- **Before phase verification:** static suite green **+** the per-screen manual TestFlight checklist (dark **and** light) complete.
- **Per CLAUDE.md workflow:** `git push` + `eas update`/native build after changes (OTA inopérant pour cet utilisateur → build natif requis pour validation device).

---

## Per-Requirement Verification Map

| Req | Behavior | Type | Automated | Manual (TestFlight, dark+light) |
|-----|----------|------|-----------|----------------------------------|
| UI-05 | Liste en table des matières : note=Display44 `T.text` à gauche, pas de N°00X, sections par mois + headers sticky, métadonnées mono alignées droite, filet | static + manual | `tsc` 0 new | Scroller la liste ; headers de mois collants ; ordre date-décroissant par section |
| UI-05 | Filtres inline (pills note-min 0/5/7/9+, tri Date/Note) | manual | — | « 9+ » → seules notes ≥9 ; tri « Note » → tri par note desc dans le mois ; pull-to-refresh + skeleton + snackbar erreur OK |
| UI-06 | Cercle restylé : nom serif, avatar carré (initiale serif italic rose), @handle mono, « Carte » underline, recherche underline, titre « Le cercle » grand serif | static + manual | `tsc` 0 new | Rechercher un nom ; « Carte » ouvre la map en vue ami |
| UI-06 | Retirer un ami (D-06) | manual | — | « Retirer » → Alert éditoriale « Retirer du cercle ? » → confirmer → ligne disparaît + snackbar « Retiré du cercle. » + haptique warn ; annuler garde la ligne |
| UI-07 | Demandes : sections eyebrow mono, Accepter/Refuser (amitié) + Sceller/Décliner (taguages, inline D-08) en boutons texte, 3e section « Envoyées » (D-09), état vide « Pas de page en attente. » | static + manual | `tsc` 0 new | Accepter/refuser une demande (haptique+snackbar) ; sceller/décliner un taguage inline (D-08, `respondToTag`) ; vérifier section vide masquée et état global vide |

---

## Wave 0 Requirements

- [ ] Capturer le compte d'erreurs tsc baseline (`npx tsc --noEmit`) avant édition → rend « 0 nouvelle erreur » mesurable.
- [ ] Aucun fichier de test à créer (aucun framework — validation manuelle = standard projet).

*Existing infrastructure (static gates) covers all phase requirements; behavioral correctness is device-verified.*

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Instructions |
|----------|-----|-----------|--------------|
| Filtre/tri correctness | UI-05 | Pas de runner ; logique de transformation visuelle | Cf. map ci-dessus (pills) |
| Unfriend confirm + removal | UI-06 | Geste destructif + Alert native | Cf. map ci-dessus |
| Accept/Refuse + Seal/Decline inline | UI-07 | Mutations Supabase RLS + haptique | Cf. map ci-dessus |
| Cohérence dark/light + safe areas | UI-05/06/07 | Rendu visuel | Chaque écran en thème clair ET sombre |

---

## Validation Sign-Off

- [ ] Static suite green (0 new tsc errors over baseline)
- [ ] Per-screen manual TestFlight checklist complete (dark + light)
- [ ] Unfriend, filter/sort, and tag-consent behaviors device-verified
- [ ] `nyquist_compliant: true` (no automated framework — manual+static is the project standard)

**Approval:** pending

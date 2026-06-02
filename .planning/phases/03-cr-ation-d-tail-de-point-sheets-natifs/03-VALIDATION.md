---
phase: 3
slug: cr-ation-d-tail-de-point-sheets-natifs
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-02
---

# Phase 3 — Validation Strategy

> **Reality :** aucun framework de test automatisé. Validation = gates statiques (`tsc`/`eslint`) + checklist manuelle TestFlight. Les sheets natifs, gestes et clavier ne se valident que sur **device physique** (le simulateur diffère).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — gates statiques |
| **Quick run command** | `npx tsc --noEmit` (0 NOUVELLE erreur vs baseline ~38) |
| **Full suite command** | `npx tsc --noEmit && npx eslint .` |
| **Estimated runtime** | ~30–60 s |

---

## Sampling Rate

- **After every task commit:** `npx tsc --noEmit` — 0 nouvelle erreur sur le fichier touché.
- **After every plan wave:** `npx tsc --noEmit && npx eslint .`.
- **Before `/gsd:verify-work`:** gates verts + checklist device cochée.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| (rempli par le planner) | — | — | IOS-01/02 · UI-03/04 | static + manual | `npx tsc --noEmit` | ⬜ pending |

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements (gates statiques en place — aucune install).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sheet création/détail s'ouvre en formSheet natif | IOS-01 | Rendu natif device | FAB ou tap pin → sheet natif (poignée, coins arrondis, détent ~0.9), swipe-to-dismiss |
| Swipe natif + tap-pin → détail direct | IOS-02 | Geste natif device | Tap pin → sheet détail direct (plus de Modal d'aperçu) ; swipe pour fermer ; re-tap d'un même pin rouvre bien |
| Dismiss-confirm si saisie en cours | D-04 | Interception native | Saisir une note/commentaire → swipe down → alerte « Abandonner ce moment ? » ; sans saisie → ferme direct |
| Clavier dans le sheet | UI-03 | Clavier device | Focus sur commentaire → le champ reste visible (KAV + scroll), le sheet ne s'effondre pas |
| Page de carnet création (note d'abord) | UI-03 | Rendu device | Note serif géante en tête, partenaire/commentaire/date dessous, CTA « Sceller la page » |
| Page de carnet détail (lecture) | UI-04 | Rendu device | Note Display, pull-quote italic, métadonnées, actions consentement/suppression ; date édition en JJ/MM/AAAA |
| Logique métier intacte | IOS-01..UI-04 | Flux device | Création (partenaire obligatoire, create_point), consentement (sceller/refuser), suppression fonctionnent comme avant |

---

## Validation Sign-Off

- [ ] Tous les tasks ont un gate statique (`tsc`/`eslint`) ou une vérif manuelle device
- [ ] Pas de 3 tasks consécutifs sans vérification
- [ ] Checklist device complète (IOS-01/02 + UI-03/04 + dismiss-confirm + clavier + garde STAB)
- [ ] `nyquist_compliant: true` posé après revue planner

**Approval:** pending

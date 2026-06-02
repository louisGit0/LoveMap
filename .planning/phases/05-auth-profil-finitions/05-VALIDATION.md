---
phase: 5
slug: auth-profil-finitions
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-06-02
---

# Phase 5 — Validation Strategy

> **No automated test framework** (no jest/vitest/playwright). Validation = static gates + manual TestFlight checklist. Project standard since Phase 1.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — static analysis + manual device validation |
| **Config file** | `tsconfig.json` (strict) |
| **Quick run** | `npx tsc --noEmit` |
| **Baseline** | ~21 erreurs pré-existantes (Supabase `never`). Gate = **0 NEW errors**. Capturer le compte frais à Wave 0. |

---

## Sampling Rate

- **Par task / commit :** `npx tsc --noEmit` → 0 nouvelle erreur.
- **Par écran :** suite statique verte.
- **Gate de phase :** statique vert **+** checklist device complète (9 écrans, clair + sombre, Dynamic Type grandes tailles) avant clôture.
- Build natif EAS de fin de phase (OTA inopérant → build requis).

---

## Per-Requirement Verification Map

| Req | Behavior | Type | Automated | Manual (TestFlight, clair+sombre) |
|-----|----------|------|-----------|------------------------------------|
| UI-01 | `login` page de couverture compacte (titre serif Cover 56 + eyebrow mono + champs underline visibles + CTA) ; `register` step 1 page de garde (âge) + step 2 cohérent | static + manual | `tsc` 0 new | Se connecter (flux intact, Snackbar erreur) ; inscription 2 étapes (âge → formulaire) crée un compte ; `MIN_AGE` corrigé (vérif client < 18 bloque) |
| UI-08 | `profile` page de couverture : avatar carré 80px, nom Cover serif, @ mono ; bento Analyse (grande tuile = **nombre de moments**, durée totale, distribution notes mono+rose, top mois) ; toggle thème unique + a11y label ; Zone irréversible | static + manual | `tsc` 0 new | **Avatar upload fonctionne (NON régressé — règles 14/15)** ; bento lisible ; toggle thème ; changer email/mdp ; suppression compte = **Alert seule** (plus de champ EFFACER) |
| IOS-04 | Safe areas (useSafeAreaInsets, pas de SafeAreaView) + home indicator (`insets.bottom`) sur les 9 écrans ; Dynamic Type plafonné (caps par rôle via AppText/`display`) ; sweep tokens espacement/typo | static + manual | `tsc` 0 new | Sur les **9 écrans** : pas de contenu sous le home indicator (login/register en particulier — `insets.bottom`) ; augmenter la taille de texte iOS (Accessibilité) → pas de casse de layout ; cohérence visuelle clair + sombre |

---

## Wave 0

- [ ] Capturer le compte tsc baseline (`npx tsc --noEmit`) avant édition.
- [ ] Étendre `AppText` d'un variant `display` (F.serifLight, cap 1.15) — pré-requis du restyle auth/profil.

---

## Manual-Only Verifications

| Behavior | Req | Why Manual | Instructions |
|----------|-----|-----------|--------------|
| Avatar upload non régressé | UI-08 | Pattern natif fragile (crashes #8/#11/#13) | Ouvrir galerie → choisir une photo → upload OK, pas de crash onglet « Moi » |
| Flux auth intact | UI-01 | Pas de runner | Login + register 2 étapes de bout en bout |
| Dynamic Type sans casse | IOS-04 | Rendu visuel | Réglages iOS → taille texte max → parcourir les 9 écrans |
| Home indicator / safe areas | IOS-04 | Rendu visuel | Vérifier login/register (plein écran sans tab bar) + les 7 autres |
| Suppression compte (Alert) | UI-08 | Action destructive | « Supprimer le compte ? » → bouton rouge → suppression |

---

## Sign-Off

- [ ] Statique vert (0 nouvelle erreur tsc sur baseline ~21)
- [ ] Checklist device complète (9 écrans, clair + sombre, Dynamic Type)
- [ ] Avatar upload, flux auth, suppression compte vérifiés device
- [ ] `nyquist_compliant: true` (manuel + statique = standard projet)

**Approval:** pending

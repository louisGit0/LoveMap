---
phase: 4
slug: listes-cercle
status: passed
verified: 2026-06-02
method: static gates + device validation (TestFlight build #28)
---

# Phase 4 — Verification (Listes & Cercle)

**Verdict : PASSED** — 3/3 requirements, validé device (#28, utilisateur « Validé »), tsc 21 (0 nouvelle erreur).

## Goal-backward

**Goal :** Refondre les écrans de listing/social selon l'archétype « table des matières ».
Les 3 écrans existants (`point/list`, `friends/index`, `friends/requests`) ont été refondus selon l'archétype + la capacité opt-in retrait d'ami. Aucun nouvel écran, aucune dérive de scope.

## Requirements

| Req | Écran | Vérif statique | Vérif device #28 |
|-----|-------|----------------|------------------|
| UI-05 | `point/list` | `PointListItem` note via `F.serifLight` Display 44 en `T.text` (pas de N°00X) ; `list.tsx` « Le carnet » + pills inline + `groupByMonth` sticky ; `FiltersBottomSheet.tsx` **supprimé** (confirmé absent) | ✅ liste table des matières, sections mois sticky, filtres pills, pull-to-refresh |
| UI-06 | `friends/index` | « Le cercle » serif, avatar carré, « Carte » underline, retrait via `unfriend` (Alert + `haptics.warn` + snackbars), recherche `ui/Input` underline ; 0 `F.sans*`/`F.serifMedium` | ✅ annuaire + retrait d'ami (Alert → suppression) |
| UI-07 | `friends/requests` | 3 sections (« Demandes reçues », « Taguages en attente », « Envoyées ») ; `useFriends.respondToTag` (3 occ.) ; consentement inline ; boutons texte solid/ghost ; W2 corrigé (`haptics.warn` refus) | ✅ 2 sections + Envoyées, Sceller/Décliner inline, Accepter/Refuser |

## Static gate

- `npx tsc --noEmit` = **21 erreurs** (baseline pré-existante Supabase `never`). Phase 4 : **0 nouvelle erreur**. La baseline est passée de 36 → 21 (suppression de `FiltersBottomSheet.tsx`, qui portait des erreurs pré-existantes).
- Aucun appel Supabase ajouté dans les composants (delete d'ami délégué via `onUnfriend` ; consentement via hook `respondToTag`).
- RLS : `respondToTag` mono-table `point_partners` (règle 18, pas de 42P17), `is_visible` jamais écrit côté client (trigger `on_partner_consent`).

## Décisions réalisées

D-01…D-10 toutes implémentées (cf. 04-CONTEXT.md). Notable : D-08 consentement taguage inline (nouveau hook), D-09 section « Envoyées » conservée, D-10 `FiltersBottomSheet` supprimé.

## Dette connue (hors périmètre, documentée)

- `handleCancel` (section « Envoyées ») et `loadFriends` gardent un appel Supabase direct (déviation rule-4 pré-existante) — non étendu, à router via hook lors d'une passe future.
- Lignes de taguage sans avatar/nom du tagueur (`PendingTag` ne le porte pas) — ancrage sur note + libellé + date.

## Build

- EAS natif **#28** (production, auto-submit TestFlight). Validé device en thèmes clair + sombre.

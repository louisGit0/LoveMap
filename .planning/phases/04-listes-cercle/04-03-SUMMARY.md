---
phase: 04-listes-cercle
plan: 03
subsystem: friends/requests (demandes)
tags: [UI-07, D-07, D-08, D-09, restyle, hook-extract]
requires:
  - useFriends (respondToRequest/unfriend)
  - point_partners (mig 010/011 RLS — partenaire tagué)
  - components/ui/Button (solid/coral/ghost)
  - lib/haptics (success/warn/error)
provides:
  - useFriends.respondToTag(pointPartnerId, accept): Promise<boolean>
  - FriendRequestItem boutons texte paramétrés (amitié vs taguage)
  - friends/requests 2 sections eyebrow + Envoyées discrète + consentement inline
affects:
  - app/(app)/(tabs)/friends/requests.tsx
  - components/friends/FriendRequestItem.tsx
  - hooks/useFriends.ts
tech-stack:
  added: []
  patterns:
    - "Extract-to-hook : logique consentement (point/[id] handleConsent) → useFriends.respondToTag (règle 4)"
    - "ui/Button + label local serif/mono (override F.sansMedium proscrit) + D-12 radiusSm/borderCurve"
    - "Empty-state conditionnel : section vide masquée ; 2 principales vides → empty unique"
key-files:
  created:
    - .planning/phases/04-listes-cercle/04-03-SUMMARY.md
  modified:
    - hooks/useFriends.ts
    - components/friends/FriendRequestItem.tsx
    - app/(app)/(tabs)/friends/requests.tsx
decisions:
  - "handleCancel (Envoyées) : déviation rule-4 existante LAISSÉE INCHANGÉE (non étendue), documentée — pas de cancelRequest() ajouté ce plan"
  - "Taguage : pas de profil dans PendingTag → ancre = note serif + comment/label (pas d'avatar+nom), boutons Sceller/Décliner inline à droite"
  - "respondToTag : cast local `as never` (types Supabase générés → never) pour 0 nouvelle erreur tsc, sans `any`"
metrics:
  duration: ~35min
  completed: 2026-06-02
  tasks: 3
  files: 3
  tsc_baseline: 21
  tsc_after: 21
---

# Phase 4 Plan 03 : Demandes (`friends/requests`, UI-07) Summary

Refonte de l'écran Demandes en archétype « table des matières » à deux sections mono-eyebrow (« DEMANDES REÇUES » amitié + « TAGUAGES EN ATTENTE » consentement partenaire) avec consentement de taguage répondu **inline** via une nouvelle méthode hook `respondToTag` (mono-table `point_partners`, RLS-safe, `is_visible` jamais touché côté client) — plus aucune navigation « Répondre → » vers le détail du point.

## What was built

- **Task 1 — `hooks/useFriends.ts` (037cc62)** : ajout de `respondToTag(pointPartnerId: string, accept: boolean): Promise<boolean>` calqué sur `respondToRequest`/`unfriend`. Update **mono-table** sur `point_partners` (`status` accepted/rejected + `responded_at`) ciblé par `.eq('id', pointPartnerId)`. Aucune écriture `is_visible` (trigger `on_partner_consent` server-side). Erreur loggée via `console.error('[useFriends] respondToTag error:', …)` + `return false` ; succès `return true`. Exposé dans le bloc `return`. `respondToRequest`/`unfriend`/`sendFriendRequest` inchangés.
- **Task 2 — `components/friends/FriendRequestItem.tsx` (967d14b)** : remplacement des boutons-icônes (`IcoCheck`/`IcoClose`) par **deux boutons texte `ui/Button`** — affirmatif `coral` rempli (label serif italic 18) + négatif `ghost` bordé (label mono Eyebrow `T.textDim`). Labels et callbacks **paramétrés** (`affirmLabel`/`negativeLabel`/`onAffirm`/`onNegative`) → un seul composant sert Accepter/Refuser (amitié) ET Sceller/Décliner (taguage). Nom passé de `F.sans` 14 → `F.serif` italic 20 (Heading). Rayons D-12 (`radiusSm` + `borderCurve:'continuous'`). Avatar carré rose + null guard conservés. Import `IcoCheck`/`IcoClose` retiré.
- **Task 3 — `app/(app)/(tabs)/friends/requests.tsx` (cb746a6)** : restructuration en **2 sections principales eyebrow mono** (« Demandes reçues » → DEMANDES REÇUES, « Taguages en attente » → TAGUAGES EN ATTENTE) + **3e section discrète « Envoyées »** (D-09). Lignes de taguage refondues : note serif en ancre + comment/label + date, **boutons Sceller/Décliner inline** (`handleRespondTag` → `respondToTag`), suppression du `router.push('/(app)/point/…')`. `handleRespondTag` jumeau de `handleRespond` (haptics success/warn, snackbars « Page scellée. »/« Taguage refusé. », reload). Empty states D-07 : section vide → header masqué ; deux principales vides → empty unique centré « Pas de page en attente. ». Titre « Demandes » serifLight 36. `F.sans*` purgé (sentName → serif italic 17 discret).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking type] `respondToTag` update → type `never` (Supabase générés)**
- **Found during:** Task 1
- **Issue:** L'`.update()` sur `point_partners` résout son paramètre à `never` (types Supabase générés désynchronisés — même dette baseline que `respondToRequest` l.53 et `point/[id]` `handleConsent` l.155, déjà comptés dans les 21). Tel quel, +1 erreur tsc (22).
- **Fix:** Cast local `as never` sur le payload (jamais assignable autrement ; `never` assignable à `never`) — pas de `any`, commenté en source. Retour à la baseline 21 (0 nouvelle erreur).
- **Files modified:** hooks/useFriends.ts
- **Commit:** 037cc62

### Carried warning (W2) — appliqué

**2. [UI-SPEC §Motion] Refus d'amitié `haptics.tap()` → `haptics.warn()`**
- La branche existante de `handleRespond` (refus d'amitié) utilisait `haptics.tap()` ; corrigée en `haptics.warn()` conformément au contrat Motion (refuser/décliner = warn). Au passage, la branche d'échec de `handleRespond` passe de snackbar « Erreur lors de la réponse. » à « Action impossible. Réessayez. » + `haptics.error()` (copie UI-SPEC).
- **Commit:** cb746a6

### Deviation rule-4 existante NON corrigée (documentée, non étendue)

- **`handleCancel` (section « Envoyées »)** : appel Supabase direct dans le composant (`supabase.from('friendships').delete()`), violation règle 4 préexistante. Conformément au plan (« le laisser tel quel … sinon le signaler comme déviation existante non corrigée … ne pas l'étendre »), il est **laissé inchangé** et commenté en source. Aucun `cancelRequest()` ajouté à `useFriends` pour rester dans le périmètre 04-03 et ne pas modifier le contrat du hook au-delà de `respondToTag`. À router via un hook dans une phase ultérieure si « Annuler » est conservé.

## Threat surface

Aucune nouvelle surface au-delà du `<threat_model>` du plan. `respondToTag` n'écrit que `status`+`responded_at` (T-04-03-02 : `is_visible` via trigger uniquement) sur une ligne ciblée par `.eq('id', …)`, RLS mig 010/011 (T-04-03-01 : seul le partenaire tagué peut maj). Mono-table → pas de récursion `42P17` (règle 18). Zéro nouvelle dépendance.

## Verification

- `npx tsc --noEmit` : **21 erreurs** avant et après les 3 tasks (0 nouvelle sur la baseline ; `respondToTag` typé `Promise<boolean>`).
- Source : `respondToTag` présent dans le `return` de `useFriends`, update `point_partners.status`(+`responded_at`) uniquement, aucune écriture `is_visible`. `FriendRequestItem` rend 2 boutons texte paramétrés. `requests.tsx` contient « Taguages en attente », `respondToTag(`, aucun `router.push` taguage, aucun `F.sans*`/`F.serifMedium`.
- **Manuel (gate device, build natif de fin de phase)** : dark + light — 2 eyebrows + Envoyées discrète ; accepter/refuser amitié ; sceller/décliner taguage inline (success/warn, sans navigation) ; section vide → header masqué ; deux principales vides → « Pas de page en attente. ».

## Known Stubs

Aucun. Toutes les données sont câblées (`pendingReceived`/`pendingTags`/`sent` via `loadRequests`, action via `respondToTag`/`respondToRequest`).

## Commits

- `037cc62` feat(04): add respondToTag to useFriends — inline taguage consent (D-08)
- `967d14b` feat(04): FriendRequestItem text buttons + serif Heading name (D-07)
- `cb746a6` feat(04): requests redesign — 2 eyebrow sections + inline taguage consent (D-07/08/09)

## Self-Check: PASSED
- hooks/useFriends.ts — FOUND (respondToTag présent)
- components/friends/FriendRequestItem.tsx — FOUND (boutons texte paramétrés)
- app/(app)/(tabs)/friends/requests.tsx — FOUND (2 sections + inline)
- .planning/phases/04-listes-cercle/04-03-SUMMARY.md — FOUND
- Commits 037cc62 / 967d14b / cb746a6 — FOUND

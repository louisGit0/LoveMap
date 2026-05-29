# Phase 1: Stabilisation & Fondations - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-29
**Phase:** 01-stabilisation-fondations
**Areas discussed:** Mapping haptique, Dynamic Type (AppText), Ordre validation / build, Périmètre fondations

---

## Mapping haptique

| Option | Description | Selected |
|--------|-------------|----------|
| Subtil & raffiné | Surtout selection/impact light | |
| Équilibré | Light nav, medium actions, notification succès/erreur | ✓ |
| Marqué & tactile | Feedback généreux partout | |

**User's choice:** Équilibré

| Moment fort | Sélectionné |
|-------------|-------------|
| Sceller un point | ✓ |
| Consentement partenaire | ✓ |
| Suppression | ✓ |
| Erreurs réseau | (non priorisé — inclus en notification error) |

**Notes:** Haptique fort réservé aux actes significatifs/irréversibles ; les erreurs réseau gardent un notification error mais en priorité moindre.

---

## Dynamic Type (AppText)

| Option | Description | Selected |
|--------|-------------|----------|
| Bornes par variant | corps ~2.0, serif ~1.3, mono ~1.2 | ✓ |
| Borne unique douce | ~1.5 partout | |
| Accessibilité max | pas de borne | |

**User's choice:** Bornes par variant

| Migration | Sélectionné |
|-----------|-------------|
| Au fil des refontes | ✓ |
| Tout de suite | |
| Nouveaux écrans seulement | |

**User's choice:** Migration au fil des refontes (AppText créé en Phase 1, appliqué phases 2-5)

---

## Ordre validation / build

| Option | Description | Selected |
|--------|-------------|----------|
| Valider #15/#16 d'abord | Confirmer builds actuels, puis build #17 fondations | ✓ |
| Tout en un build #17 | Builder direct avec fondations | |

**User's choice:** Valider #15/#16 d'abord

| Critère STAB | Sélectionné |
|--------------|-------------|
| Test manuel à 2 comptes | |
| Test manuel solo | |
| Tu décides | ✓ |

**User's choice:** Claude propose une checklist de validation, l'utilisateur coche.

---

## Périmètre fondations

| Option | Description | Selected |
|--------|-------------|----------|
| Installer maintenant (socle) | reanimated v4 + gesture-handler + GestureHandlerRootView en Phase 1 | ✓ |
| Différer au 1er usage | YAGNI | |

**User's choice:** Installer maintenant (socle)

| Smoke test | Sélectionné |
|------------|-------------|
| Mini geste de preuve | |
| Juste le wrapper | |
| Tu décides | ✓ |

**User's choice:** Claude décide la preuve minimale.

---

## Claude's Discretion

- Forme exacte du smoke test natif (recommandation : composant Reanimated jetable derrière flag dev, vérifié sur device, retiré ensuite)
- Signatures/structure de `lib/haptics.ts` et `AppText`
- Rédaction de la checklist de validation STAB
- Ne pas éditer `babel.config.js` (géré par babel-preset-expo)

## Deferred Ideas

- Migration massive des `<Text>` → progressif phases 2-5
- Câblage haptique des écrans refondus → au fil des refontes
- Usage réel reanimated/gesture-handler (gestes, swipe-back, animations) → phases 2-3

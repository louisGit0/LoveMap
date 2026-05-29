# Phase 1: Stabilisation & Fondations - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Sécuriser la base technique de la refonte UI/UX et confirmer que les corrections des builds #15/#16 tiennent sur TestFlight. Cette phase ne livre aucune nouvelle capacité produit ni refonte d'écran — elle pose les primitives (haptique, Dynamic Type) et le socle natif (reanimated, gesture-handler, runtimeVersion fingerprint) sur lesquels reposent les phases 2-5.

**Couvre :** STAB-01/02/03 (validation #15/#16), FOND-01 (runtimeVersion fingerprint), FOND-02 (reanimated + gesture-handler + GestureHandlerRootView), FOND-03 (lib/haptics.ts), FOND-04 (AppText), IOS-03 (câblage haptique des actions clés existantes).

**Hors scope :** toute refonte d'écran, le style Mapbox, les bottom sheets natifs (phases 2-3), la migration massive des `<Text>`.
</domain>

<decisions>
## Implementation Decisions

### Mapping haptique (lib/haptics.ts)
- **D-01:** Philosophie **équilibrée** — `selection`/`impact light` pour navigation et taps courants, `impact medium` pour les actions importantes, `notification` (success/warning/error) pour les résultats d'action.
- **D-02:** Haptique fort (notification) sur ces moments précis :
  - Sceller un point (création) → `notification success`
  - Consentement partenaire → `notification success` (accepter) / `notification warning` (refuser)
  - Suppression point ou compte → `notification warning` (acte irréversible)
  - Erreurs réseau → `notification error` (inclus mais priorité moindre)
- **D-03:** `lib/haptics.ts` centralise tout en **fire-and-forget** (jamais d'`await` bloquant), avec une API par intention (ex. `tap()`, `select()`, `success()`, `warn()`, `error()`). Aucun appel direct à `expo-haptics` ailleurs dans le code.

### Dynamic Type (AppText)
- **D-04:** Bornes `maxFontSizeMultiplier` **par variant** — corps ~2.0, titres serif (Cormorant) ~1.3, eyebrows/mono (JetBrains) ~1.2. `allowFontScaling` reste `true`. Protège la typo éditoriale d'une casse de layout.
- **D-05:** Migration **progressive** — `AppText` est créé en Phase 1 mais appliqué écran par écran lors des refontes (phases 2-5). Les `<Text>` bruts existants ne sont PAS migrés en masse en Phase 1.
- **D-06:** `AppText` expose des variants alignés sur les tokens `constants/fonts.ts` (F.serif, F.serifLight, F.sans, F.sansMedium, F.mono, …) ; pas de nouvelle source de vérité typographique.

### Ordre validation / build
- **D-07:** Séquence stricte — (1) valider #15/#16 sur les builds TestFlight **actuels**, (2) PUIS produire le build #17 avec les fondations natives. Isole les régressions (on ne mélange pas vérif de bugs et nouveau natif).
- **D-08:** STAB-01/02/03 sont « validés » via une **checklist** proposée par Claude que l'utilisateur coche (cf. `<specifics>`). Pas de critère automatisé.

### Périmètre fondations
- **D-09:** Installer le **socle natif dès la Phase 1** : `react-native-reanimated` v4 + `react-native-gesture-handler`, avec un unique `GestureHandlerRootView` à la racine (`app/_layout.tsx`), même sans usage fonctionnel immédiat. Objectif : isoler le risque natif TestFlight tôt, avant les phases qui en dépendent.
- **D-10:** Passer `app.json` en `runtimeVersion: { policy: "fingerprint" }` AVANT le build #17 (piège TestFlight critique identifié par la recherche).

### Claude's Discretion
- **Smoke test natif** (D-09) : preuve minimale laissée à Claude. Recommandation retenue — wrapper `GestureHandlerRootView` + un composant Reanimated **jetable** (micro-animation derrière un flag dev) vérifié une fois sur device iOS pour confirmer que les worklets reanimated v4 tournent, puis retiré avant clôture de phase.
- Signatures exactes et structure de fichiers de `lib/haptics.ts` et `AppText`.
- **Ne pas éditer `babel.config.js`** — le plugin worklets est géré automatiquement par `babel-preset-expo` (per recherche). Ne pas ajouter de plugin manuel.
- Rédaction de la checklist de validation STAB.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Recherche du cap (UI/UX iOS)
- `.planning/research/SUMMARY.md` — synthèse : socle natif, runtimeVersion fingerprint, bottom sheets, mapping haptique
- `.planning/research/STACK.md` — Mapbox/clustering (pertinent phases 2+, contexte)
- `.planning/research/ARCHITECTURE.md` §Haptics, §Safe Areas & Dynamic Type, §Gestures — patterns reanimated/gesture-handler, mapping haptique prescriptif, bornes maxFontSizeMultiplier
- `.planning/research/PITFALLS.md` §Reanimated/Gestures, §Redesign-Wide Risks — runtimeVersion statique, install reanimated v4 New Arch, GestureHandlerRootView, babel

### Cadre projet
- `.planning/PROJECT.md` — identité, contraintes, pièges connus
- `.planning/REQUIREMENTS.md` — REQ-IDs Phase 1 (STAB/FOND/IOS-03)
- `CLAUDE.md` — règles obligatoires (imports dynamiques natifs, builds vs OTA, tokens theme/fonts, zéro emoji, UI français)
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `expo-haptics` : **déjà installé** — `lib/haptics.ts` l'enveloppe, pas de nouvelle dépendance pour FOND-03/IOS-03
- `constants/theme.ts` / `constants/fonts.ts` : tokens existants — `AppText` consomme `F.xxx`, pas de duplication
- `app/_layout.tsx` : racine actuelle (PaperProvider + auth listener) — point d'insertion du `GestureHandlerRootView`
- Hooks existants (`usePoints`, `useFriends`, `useAuth`) et écrans (`point/new`, `point/[id]`, `profile`) : points de câblage haptique des actions clés (sceller, consentement, suppression)

### Established Patterns
- `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` — pattern thème sur tous les composants
- Tokens police via `F.xxx` (jamais de fontFamily hardcodée)
- Import dynamique `require()` à l'intérieur des fonctions pour modules natifs sensibles (expo-image-picker, expo-file-system)
- Builds natifs requis pour tout changement natif (OTA inopérants chez l'utilisateur)

### Integration Points
- `AppText` enveloppe le `<Text>` de react-native + applique variant → fontFamily + maxFontSizeMultiplier
- `lib/haptics.ts` importé par les handlers d'action (hooks + écrans) ; câblage Phase 1 limité aux actions clés existantes (sceller, consentement, suppression, erreurs)
- `GestureHandlerRootView` en wrapper racine de `app/_layout.tsx`
- `app.json` → bloc `runtimeVersion` (politique fingerprint)
</code_context>

<specifics>
## Specific Ideas

### Checklist de validation STAB (proposée — l'utilisateur coche)
À exécuter sur les builds TestFlight **actuels** (#15 pour la photo, #16 pour zoom/mention) AVANT le build #17 :

- **STAB-01 (photo profil, #15)** : onglet Profil → tap sur la photo/avatar → la galerie iOS s'ouvre sans crash → sélectionner une image → l'avatar se met à jour.
- **STAB-02 (pins au dézoom, #16)** : carte avec ≥1 point → dézoomer au maximum → les pins restent visibles à tous les niveaux.
- **STAB-03 (mention partenaire, #16)** : testeur 1 crée un point en taguant testeur 2 → testeur 2 ouvre Cercle → Demandes → section « Taguages » affiche le point → testeur 2 peut Sceller/Refuser.
  - *Note :* nécessite 2 comptes ; à défaut, valider en best-effort.

### Mapping haptique cible (référence pour le plan)
| Action | Haptique |
|--------|----------|
| Navigation, tap courant | selection / impact light |
| Action importante (ouverture sheet, toggle) | impact medium |
| Sceller un point | notification success |
| Accepter consentement | notification success |
| Refuser consentement | notification warning |
| Supprimer point/compte | notification warning |
| Erreur réseau | notification error |
</specifics>

<deferred>
## Deferred Ideas

- Migration massive de tous les `<Text>` vers `AppText` — fait progressivement pendant les refontes (phases 2-5), pas en Phase 1 (D-05).
- Câblage haptique des écrans refondus — au fil des refontes ; Phase 1 ne câble que les actions clés sur le code existant (IOS-03).
- Usage réel de reanimated/gesture-handler (gestes, animations markers, swipe-back) — phases 2-3 ; Phase 1 ne fait que poser le socle + smoke test.

*Aucun scope creep — la discussion est restée dans le périmètre de la phase.*
</deferred>

---

*Phase: 01-stabilisation-fondations*
*Context gathered: 2026-05-29*

# Phase 5: Auth, Profil & Finitions - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Dernière phase du milestone. Refonte **visuelle** des écrans d'auth et de profil selon l'archétype **« page de couverture »**, + une **passe de finitions iOS transverse** sur les 9 écrans.

**Dans le périmètre :**
- `app/(auth)/login.tsx` (UI-01)
- `app/(auth)/register.tsx` (UI-01 — stepper 2 étapes âge→formulaire déjà en place, règle 10, à restyler)
- `app/(app)/(tabs)/profile/index.tsx` (UI-08)
- **IOS-04** : audit + correctifs safe areas / home indicator / Dynamic Type sur les **9 écrans**, **+ sweep de cohérence** (aligner espacements/typo sur les tokens), en thèmes clair ET sombre.

**Hors périmètre :** nouvelle logique d'auth (flux, providers), nouvelles capacités profil, toute la data (déjà en place). Pas de social login, pas d'onboarding multi-slides, pas de dégradés (anti-features recherche).
</domain>

<decisions>
## Implementation Decisions

### Connexion (`login`) — UI-01
- **D-01 :** **En-tête éditorial compact + champs immédiatement visibles** (PAS de champs sous la ligne de flottaison). En-tête = titre serif italic + eyebrow mono (« LOVEMAP · ÉDITION INTIME »), puis email/mot de passe en **inputs underline** visibles sans scroll, + CTA. Numéro d'édition / date en mono possible en ourlet (sobre). Gestion d'erreur via Snackbar (existant).

### Inscription (`register`) — UI-01
- **D-02 :** Conserver le **stepper 2 étapes** (âge → formulaire, règle 10, validation serveur trigger `handle_new_user` inchangée). **Step 1 (âge) traité en page de garde solennelle** (grand serif + eyebrow), step 2 (formulaire) cohérent avec le login (inputs underline, CTA). Restyle uniquement, pas de changement de flux.

### Profil (`profile/index`) — UI-08
- **D-03 :** **Page de couverture personnelle** : avatar **carré 80px** (initiale serif italic rose ou photo), nom en **grand serif**, handle/@username en mono. Avatar upload conservé via **require dynamique d'`expo-image-picker` dans la fonction** (règles 14/15 STRICTES — JAMAIS `requestMediaLibraryPermissionsAsync()`, JAMAIS d'import statique).
- **D-04 :** Section **« Analyse » en mini-bento éditorial** — tuiles de tailles variées (taille = importance, principe bento). **La GRANDE tuile = le nombre de moments** (gros chiffre serif, « pages du carnet »). Autres tuiles : durée totale cumulée, distribution des notes (barres **monochromes + rose**), top 3 mois. **Monochrome discipliné** : niveaux de `T.surface` + un seul accent `T.primary` — aucune palette multi-couleurs.
- **D-05 :** Conserver toggle thème (IcoSun/IcoMoon), édition email/mot de passe (`supabase.auth.updateUser`), section **« Zone irréversible »** (suppression compte). Restyle, pas de changement fonctionnel.

### Finitions transverses — IOS-04
- **D-06 :** **Dynamic Type : support avec plafonds.** Le texte grossit avec les réglages d'accessibilité iOS via `allowFontScaling` mais borné par `maxFontSizeMultiplier` (plafonds par rôle typo : plus serrés pour Display/titres serif, plus larges pour corps), de sorte que la mise en page éditoriale ne casse pas. Levier central = composant `AppText` (router le texte par là où c'est possible) + plafonds cohérents.
- **D-07 :** **Audit + sweep de cohérence sur les 9 écrans** : (a) safe areas via `useSafeAreaInsets()` (jamais `SafeAreaView`), home indicator (padding bas = `insets.bottom`) ; (b) Dynamic Type plafonné ; (c) **sweep tokens** — corriger les derniers espacements/tailles typo hors-échelle pour les aligner sur les tokens (`T.*`/`F.*`, échelle canonique), en clair ET sombre. Corriger les casses réelles ; ne pas réécrire ce qui est déjà cohérent.

### Résolutions post-recherche (2026-06-02, après 05-RESEARCH.md)
- **D-08 :** **Suppression de compte = Alert seule** (suivre le UI-SPEC) — Alert native « Supprimer le compte ? » + bouton destructif `T.danger`. **Retirer le champ à taper « EFFACER »** actuel. La section reste « Zone irréversible ».
- **D-09 :** **Toggle thème unique** — garder le toggle éditorial IcoSun/IcoMoon (UI-SPEC), **retirer le `Switch` doublon** s'il existe dans profile/index.tsx. Ajouter un `accessibilityLabel` (« Basculer vers le thème clair »/« …sombre ») — flag checker Visuals.
- **D-10 :** **Button : pas de modif du primitive partagé** `components/ui/Button.tsx`. Les arrondis/styles spécifiques aux écrans de couverture passent par des overrides **par instance** (blast-radius limité), pas par un changement global du composant.
- **D-11 :** **Fix bug latent `MIN_AGE`** — `register.tsx` importe `{ MIN_AGE }` alors que `constants/config.ts` n'exporte que `APP_CONFIG.MIN_AGE` (nested) → la vérif d'âge **client** est inerte (`undefined`). Corriger l'import (`APP_CONFIG.MIN_AGE`) pendant le restyle du step 1. Le trigger serveur `handle_new_user` reste le garde-fou autoritaire (inchangé).
- **D-12 :** **CTA register step 1** — remplacer « Continuer » par un libellé plus spécifique (ex. « Vérifier mon âge ») — flag checker Copywriting (non bloquant).

### Claude's Discretion
- Plafonds exacts `maxFontSizeMultiplier` par rôle → UI-SPEC / planner.
- Disposition précise des tuiles bento (grille, tailles) → UI-SPEC.
- Liste précise des écrans à toucher dans le sweep (selon ce que l'audit révèle) → planner/researcher.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Archétype & direction visuelle
- `.planning/research/FEATURES.md` §Auth (l. 87-93) + §Profile (l. 143-149) — différenciateurs « page de couverture » / « couverture de magazine » + bento monochrome.
- `.planning/research/FEATURES.md` §Recommendations (l. 158, 165) — archétype page de couverture + monochrome discipliné (tile size = importance, jamais volume).
- `CLAUDE.md` §« Identité visuelle » — tokens `T.*`/`F.*`, conventions (avatars carrés, inputs underline, eyebrows mono, zéro emoji, copie éditoriale), pivot D-12.
- `.planning/phases/04-listes-cercle/04-UI-SPEC.md` — discipline typo serif+mono (4 tailles / 2 graisses), cohérence à étendre.

### Scope & exigences
- `.planning/ROADMAP.md` §Phase 5 — goal + 4 success criteria.
- `.planning/REQUIREMENTS.md` — UI-01, UI-08, IOS-04.

### Contraintes techniques (critiques)
- `CLAUDE.md` règle 10 (age gate dans register — flux inchangé, validation serveur trigger), **règles 14 et 15 (expo-image-picker / expo-file-system : require dynamique dans la fonction, JAMAIS `requestMediaLibraryPermissionsAsync`)** — l'avatar profil en dépend, ne PAS régresser, règle 13 (tab bar opaque).
- `constants/theme.ts`, `constants/fonts.ts` — tokens.
- `constants/config.ts` — `MIN_AGE`, etc.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/ui/AppText.tsx` — **levier Dynamic Type** (y centraliser `maxFontSizeMultiplier` par variant). Caveat Phase 4 : `variant="title"` mappe `F.serif` (400), pas `F.serifLight` (300) — pour du 300 mettre `fontFamily: F.serifLight` directement.
- `components/ui/{Button, Input (underline), PageHeader, PressableScale, SkeletonItem}` — primitives.
- Icônes SVG `components/icons.tsx` (IcoSun/IcoMoon pour le toggle thème).

### Established Patterns
- Thème : `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` (dark/light).
- `useSafeAreaInsets()` partout (jamais `SafeAreaView`). Textes en français. Pas d'appels Supabase hors hooks/stores.

### Integration Points
- `app/(auth)/login.tsx` + `register.tsx` (stepper âge via `authStore`), `hooks/useAuth.ts`, `stores/authStore.ts`.
- `app/(app)/(tabs)/profile/index.tsx` — analyse (distribution notes / top 3 mois / durée totale → ajouter « nombre de moments » en grande tuile), `useThemeStore` (toggle), `supabase.auth.updateUser` (email/mdp), suppression compte, **avatar via require dynamique `expo-image-picker`** (règles 14/15).
- IOS-04 : les **9 écrans** = login, register, map/index, point/new, point/[id], point/list, friends/index, friends/requests, profile/index.
</code_context>

<specifics>
## Specific Ideas

- Auth = **couverture de magazine** (titre serif italic + eyebrow mono « LOVEMAP · ÉDITION INTIME » + ourlet mono), mais champs visibles (D-01).
- Profil = **page de couverture personnelle** ; bento monochrome+rose, grande tuile = **nombre de moments**.
- « Zone irréversible » pour la suppression (ton éditorial, `T.danger`, cohérent Phases 3/4).
- Dynamic Type plafonné, pas désactivé (accessibilité sans casse).
</specifics>

<deferred>
## Deferred Ideas

- Nouveau flux d'auth / social login / onboarding multi-slides — anti-features, hors périmètre.
- Nouvelles métriques d'analyse au-delà de l'existant (+ nombre de moments) — backlog éventuel.

*None bloquant — discussion restée dans le périmètre.*
</deferred>

---

*Phase: 5-Auth, Profil & Finitions*
*Context gathered: 2026-06-02*

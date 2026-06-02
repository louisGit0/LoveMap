# Phase 4: Listes & Cercle - Context

**Gathered:** 2026-06-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Refonte **visuelle** des 3 écrans de listing / social selon l'archétype **« table des matières »** (gros numéro/initiale à gauche, serif, métadonnées mono alignées à droite, filet de séparation). Aucune nouvelle navigation ni nouvel écran.

**Dans le périmètre :**
- `app/(app)/(tabs)/point/list.tsx` — liste des moments (UI-05)
- `app/(app)/(tabs)/friends/index.tsx` — « le cercle » (UI-06)
- `app/(app)/(tabs)/friends/requests.tsx` — demandes (UI-07)
- Une seule capacité fonctionnelle ajoutée (opt-in utilisateur) : **retirer un ami du cercle** (D-06).

**Hors périmètre :** auth/profil (Phase 5), carte (Phase 2, faite), création/détail point (Phase 3, fait), tout autre nouvel ajout social (bloquer/signaler, compteurs, etc.).
</domain>

<decisions>
## Implementation Decisions

### Liste des moments (`point/list`) — UI-05
- **D-01 :** Le **gros chiffre serif** à gauche de chaque ligne = **la note /10** du moment (pas un numéro séquentiel N°00X, pas la date). La note est l'ancre visuelle de la table des matières ; le « /10 » peut accompagner discrètement en mono.
- **D-02 :** Liste **groupée par mois** — header de section en **eyebrow mono** (ex. « JUIN 2026 »), moments triés par date décroissante au sein de chaque section.
- **D-03 :** **Filtres inline en haut de la liste** (barre de pills/segments : note min 0/5/7/9+, tri date/note) — **suppression de l'usage de `FiltersBottomSheet`** sur cet écran. Zéro sheet (plus direct + évite toute zone d'ombre iOS 26).
- **D-04 :** Conserver l'existant fonctionnel : pull-to-refresh, skeleton (`SkeletonRow`), snackbar erreur réseau.

### Le cercle (`friends/index`) — UI-06
- **D-05 :** Chaque ami = **entrée d'annuaire intime** : avatar **carré** (initiale serif italic rose), nom en serif, handle/username en mono à droite, action « **Carte** » (vue ami) en bouton **underline** discret. Titre d'écran « Le cercle » en grand serif. Recherche en champ **underline**.
- **D-06 :** **Ajouter l'action « retirer du cercle »** sur chaque ami (capacité opt-in validée par l'utilisateur). **Confirmation obligatoire** au ton éditorial (« Retirer du cercle ? », ton irréversible léger, libellé destructif en `T.danger`). Passe par le hook `useFriends` (pas d'appel Supabase dans le composant) ; respecter la RLS friendships (relation bidirectionnelle requester/addressee).

### Demandes (`friends/requests`) — UI-07
- **D-07 :** **Deux sections** à eyebrow mono : « DEMANDES REÇUES » (amitié) et « TAGUAGES EN ATTENTE » (consentement partenaire, migration 010). Chaque ligne = entrée éditoriale avec actions **Accepter/Refuser** en boutons texte (solid / ghost), ton « sceller / décliner ». État vide « Pas de page en attente ».

### Résolutions post-recherche (2026-06-02, après 04-RESEARCH.md)
- **D-08 :** Sur l'écran Demandes, répondre à un **taguage partenaire en attente se fait INLINE** (boutons « Sceller » / « Décliner » sur la ligne). Ajouter une petite méthode hook `respondToTag(pointPartnerId, accept)` dans `useFriends` (ou hook dédié) — mono-table `point_partners`, RLS-safe (mig 010/011, règle 18), pas d'appel Supabase dans le composant. Ne PAS naviguer vers le détail du point pour cette action.
- **D-09 :** L'écran Demandes **conserve une 3e section « Envoyées »** (demandes d'amitié envoyées en attente), discrète sous les deux sections principales (« Demandes reçues », « Taguages en attente »). Les eyebrows mono des deux sections principales restent l'accent éditorial ; « Envoyées » est secondaire.
- **D-10 :** Le composant `components/point/FiltersBottomSheet.tsx` devient **orphelin** après le passage aux filtres inline (D-03) → **le supprimer** (et nettoyer tout import résiduel).

### Claude's Discretion
- Tailles/espacements exacts (taille du numéro de note, hauteur des lignes, gaps) → UI-SPEC / planner.
- Implémentation du retrait d'ami (signature de la méthode `useFriends`, opération Supabase delete/blocked, mise à jour `friendStore`) → researcher/planner. Respecter RLS et règle 18 (pas de récursion croisée).
- Style précis de la barre de filtres inline (pills vs segments) → UI-SPEC.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Archétype & direction visuelle
- `.planning/research/FEATURES.md` §Point-list / Friends / Requests (l. 118-141) — différenciateurs « table des matières » par écran.
- `.planning/research/FEATURES.md` §Recommendations (l. 155-160) — les 3 archétypes réutilisables.
- `CLAUDE.md` §« Identité visuelle » — tokens `T.*` / `F.*`, conventions (avatars carrés, inputs underline, eyebrows mono, zéro emoji, copie éditoriale), pivot D-12 (formes iOS arrondies).

### Scope & exigences
- `.planning/ROADMAP.md` §Phase 4 — goal + 3 success criteria.
- `.planning/REQUIREMENTS.md` — UI-05, UI-06, UI-07.

### Contraintes techniques
- `CLAUDE.md` règle 13 (tab bar opaque), règle 18 (RLS : pas de récursion croisée — pertinent pour la suppression d'ami), contraintes de sécurité (RLS, `creator_id === auth.uid()`).
- `constants/theme.ts`, `constants/fonts.ts` — tokens design (ne rien hardcoder).
- `.planning/phases/03-cr-ation-d-tail-de-point-sheets-natifs/03-UI-SPEC.md` — discipline typo serif+mono, rayons D-12 (cohérence avec la Phase 3).
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `components/point/PointListItem.tsx` (`PressableScale`) — ligne de moment à refondre en archétype table des matières.
- `components/point/FiltersBottomSheet.tsx` — **à retirer de `list.tsx`** (filtres passent inline) ; le composant peut rester pour un usage futur ou être supprimé si plus référencé.
- `components/friends/FriendItem.tsx`, `components/friends/FriendRequestItem.tsx` — à refondre.
- `components/ui/` : `Button` (variants `solid`/`coral`/`ghost`/`danger`/`underline`), `Input` (underline), `SkeletonItem`/`SkeletonRow`, `PressableScale`, `PageHeader`.

### Established Patterns
- Pattern thème : `const T = useTheme(); const styles = useMemo(() => makeStyles(T), [T]);` sur chaque composant (dark/light).
- `useSafeAreaInsets()` (jamais `SafeAreaView`). Icônes SVG custom dans `components/icons.tsx` (pas de vector-icons). Tous les textes en français.
- **Pas d'appels Supabase dans les composants** — tout via hooks (`usePoints`, `useFriends`).

### Integration Points
- `hooks/useFriends.ts` + `stores/friendStore.ts` — étendre pour **retirer un ami** (nouvelle méthode + maj store). Table `friendships` (status `pending/accepted/rejected/blocked`, relation bidirectionnelle).
- `hooks/usePoints.ts` + `stores/mapStore.ts` — source des moments (déjà en place) ; le groupement par mois et les filtres inline sont une transformation côté écran.
- Demandes : taguages partenaire en attente via `point_partners` + fonction `is_pending_partner` (migration 010/011).
</code_context>

<specifics>
## Specific Ideas

- Liste = **table des matières de magazine** : note /10 en gros serif à gauche, lieu/titre en serif, date en mono alignée droite, filet fin, headers de mois en eyebrow mono.
- Cercle = **annuaire intime** ; demandes = ton « sceller / décliner ».
- Retrait d'ami : confirmation éditoriale, libellé destructif `T.danger` (cohérent avec « Effacer cette page » de la Phase 3).
</specifics>

<deferred>
## Deferred Ideas

- Bloquer / signaler un ami, compteurs sociaux, vue profil d'un ami — hors périmètre refonte ; à proposer en backlog si besoin.

*Le retrait d'ami (D-06) n'est PAS différé — l'utilisateur l'a explicitement intégré à la Phase 4.*
</deferred>

---

*Phase: 4-Listes & Cercle*
*Context gathered: 2026-06-02*

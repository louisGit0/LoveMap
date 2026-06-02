# Phase 4: Listes & Cercle - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-02
**Phase:** 4-Listes & Cercle
**Areas discussed:** Numéro liste, Groupement, Filtres, Actions social

---

## Numéro liste (gros chiffre à gauche de chaque moment)

| Option | Description | Selected |
|--------|-------------|----------|
| N°001 séquentiel | Numéro de page chronologique façon table des matières de magazine | |
| La note /10 | Le gros chiffre = la note d'intensité du moment | ✓ |
| Date (jour) | Le gros chiffre = le jour du mois, façon agenda | |

**User's choice:** La note /10
**Notes:** La note devient l'ancre visuelle de la table des matières. Le « /10 » accompagne en mono.

---

## Groupement (organisation de la liste)

| Option | Description | Selected |
|--------|-------------|----------|
| Sections par mois | Headers eyebrow mono (« JUIN 2026 ») regroupant les moments | ✓ |
| Liste plate chronologique | Une seule liste continue sans headers | |

**User's choice:** Sections par mois

---

## Filtres (note min, tri)

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom sheet (existant) | Garder FiltersBottomSheet (Modal RN) | |
| Barre inline en haut | Filtres/tri visibles en haut de la liste (pills/segments) | ✓ |

**User's choice:** Barre inline en haut
**Notes:** Zéro sheet → plus direct + évite toute zone d'ombre iOS 26. `FiltersBottomSheet` retiré de `list.tsx`.

---

## Actions social (cercle + demandes)

| Option | Description | Selected |
|--------|-------------|----------|
| Conserver l'existant | Refonte purement visuelle, aucune nouvelle action | |
| Ajouter retirer un ami | Ajoute l'action « retirer du cercle » par ami | ✓ |

**User's choice:** Ajouter retirer un ami
**Notes:** Capacité opt-in explicitement intégrée à la Phase 4 (malgré le flag « potentiellement hors-scope refonte »). Confirmation éditoriale obligatoire, libellé destructif `T.danger`, via `useFriends` + RLS friendships.

## Claude's Discretion

- Tailles/espacements exacts (numéro de note, hauteur des lignes).
- Implémentation du retrait d'ami (signature hook, opération Supabase).
- Style précis de la barre de filtres inline (pills vs segments).

## Deferred Ideas

- Bloquer / signaler un ami, compteurs sociaux, vue profil d'un ami — backlog éventuel.

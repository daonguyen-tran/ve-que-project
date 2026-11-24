# ADR 0007 — Une couleur par étape, choisie par l'utilisateur

- **Statut** : accepté
- **Date** : 24/11/2026

## Contexte

La couleur d'une étape venait de son type : toutes les villes en indigo, tous les villages en
jade, toutes les îles en sarcelle. Dans la frise et le calendrier, deux villes à la suite
(Hô Chi Minh-Ville puis Hoi An) se confondaient.

## Décision

- Chaque étape porte une **couleur** parmi huit (`STOP_COLORS` dans le domaine : indigo, jade,
  sarcelle, ocre, prune, lotus, ciel, ardoise). Ce sont des noms de jetons, pas des valeurs
  CSS, comme pour les membres.
- Une nouvelle étape reçoit la **première couleur libre** (`suggestStopColor`) ; l'utilisateur
  la change dans la fiche (pastilles).
- La couleur de l'étape colore la frise des nuits, le pavé de date des cartes, les nuits prises
  dans le calendrier et les pastilles des jours. Le type garde son icône et son libellé sur un
  badge neutre ; la légende de la frise nomme les étapes.

## Compatibilité

Le champ `color` est **facultatif** dans le schéma. Une étape sans couleur (créée avant cette
version, ou venue d'une ancienne sauvegarde) prend celle de son type (`stopColorOf`) : elle
garde son apparence, sans migration de la base ni nouvelle version du format de sauvegarde.

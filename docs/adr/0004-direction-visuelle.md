# ADR 0004 — Direction visuelle « Billets en đồng »

- **Statut** : accepté
- **Date** : 23/11/2026

## Contexte

L'utilisateur voulait un design sobre, moderne, intuitif, aux couleurs qui rappellent le
Vietnam (rouge, jaune), et pas un « style IA ». Trois directions ont été dessinées sur une
toile de comparaison : _Billets en đồng_, _Calendrier à effeuiller_ et _Standard sobre_.

## Décision

L'utilisateur a choisi **Billets en đồng** : coque rouge laque, montants affichés comme la
valeur faciale d'un billet, catégories de dépenses aux couleurs des billets, jaune curcuma
réservé au « maintenant ». Le détail est dans `DESIGN.md`.

## Conséquences

- L'argent, premier problème de l'utilisateur, est au centre de l'écran d'accueil.
- Les jetons sont dans `apps/web/src/styles/index.css` ; le mode sombre consistera à les
  redéfinir.
- Le rouge étant la couleur de marque, les alertes ne reposent jamais sur la couleur seule.

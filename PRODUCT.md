# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Monorepo pnpm. PWA React 19 + TypeScript (strict) + Vite, styles en Tailwind CSS sans bibliothèque de composants, IndexedDB via Dexie (offline-first), React Router, Zod. Hébergement Vercel. Backend v2 : Node + TypeScript + PostgreSQL maison. Choix de l'utilisateur, voir `docs/cahier-des-charges.md` §6.

## Users

- **Utilisateur principal** : étudiant en développement logiciel, d'origine vietnamienne, qui prépare un voyage de trois semaines au Vietnam en famille (4 personnes) à l'été 2027. Il planifie le soir sur PC, puis utilise l'appli sur son téléphone Android pendant le voyage : dans la rue, au marché, dans un taxi, souvent d'une main, en plein soleil et parfois sans réseau.
- **Famille** (3 autres voyageurs) : apparaissent comme membres du voyage (payeurs, participants aux dépenses). Plus tard, ils pourront consulter et modifier le voyage.

## Product Purpose

Về Quê (« rentrer au pays natal ») aide à préparer puis à vivre un voyage au Vietnam : un itinéraire par étapes et par créneaux (matin, après-midi, soir) qui laisse de la place au temps libre, une banque d'idées par ville, et surtout un suivi des dépenses qui dit à tout moment où est passé l'argent et ce qu'il reste en liquide. Réussite : chaque dépense saisie en moins de 5 secondes, une idée d'activité trouvée en moins de 3 gestes, chaque jour planifié avant le départ, tout utilisable hors ligne.

## Positioning

Un outil personnel conçu pour la réalité d'un voyage familial au Vietnam, pas une appli de voyage générique : saisie des montants « à la vietnamienne » (`50k`, `1,2M`), portefeuilles d'espèces en đồng, jours au village chez la famille traités comme des étapes à part entière, fonctionnement complet sans réseau.

## Operating Context

- Trois semaines, étapes : Hô Chi Minh-Ville, Phu Quoc, Da Nang, Hoi An, Hue, et des villages familiaux.
- Été : forte chaleur, soleil intense, averses dans le Sud. Lecture en extérieur au soleil.
- Réseau intermittent (villages, trajets, île).
- Montants à 5 à 7 chiffres en VND ; devise de référence EUR.
- Planification sur PC (écran large, souris) ; usage terrain sur Android (écran étroit, pouce).

## Capabilities and Constraints

Fonctionnalités confirmées (détail et priorités dans `docs/cahier-des-charges.md`) : voyages multiples et membres ; itinéraire (étapes, hébergements, trajets, jours dérivés, créneaux avec heure optionnelle, temps libre, statuts) ; banque d'idées et filtre « J'ai du temps libre » ; carte en ligne ; dépenses avec saisie rapide « 50k », taux de change figé, répartition optionnelle à parts égales ; portefeuilles espèces et carte ; budget descendant et ascendant ; écran « Aujourd'hui » ; checklist avant départ ; météo par étape ; fiches famille et liste de cadeaux ; journal ; aide aux billets VND ; prix de référence ; export/import JSON.

Contraintes : offline-first ; interface en français, textes centralisés ; mode sombre reporté (couleurs en variables) ; montants en entiers ; aucun service payant.

Hors périmètre v1 : gestion de billets PDF, mode chauffeur, calendrier lunaire, photo des reçus, carte hors ligne, notifications.

## Brand Commitments

- Nom : **Về Quê**, avec ses diacritiques dans l'interface ; `ve-que` en technique.
- Couleurs qui **rappellent le Vietnam, comme le rouge ou le jaune** (demande explicite de l'utilisateur, palette laissée au choix du designer).
- **Sobre, moderne, ergonomique et intuitif ; pas un « style IA »** (demande explicite).

## Evidence on Hand

Aucun contenu réel pour l'instant : pas de photos, pas de logo, pas de données de voyage (dates et étapes non encore fixées). Toute donnée de démonstration doit être signalée comme fictive.

## Product Principles

1. **La saisie avant tout** : une dépense ou un changement de plan doit se faire plus vite que de l'oublier.
2. **Jamais sans réseau, jamais sans données** : tout fonctionne hors ligne, rien ne se perd.
3. **Un plan qui respire** : structurer les journées sans les remplir ; le temps libre est une case légitime.
4. **Des chiffres impossibles à mal lire** : séparateurs de milliers, équivalent en euros, devise toujours visible.
5. **La famille au centre** : les jours au village et les proches sont des données de premier rang.

## Accessibility & Inclusion

Contrastes WCAG AA, lisibilité en plein soleil, zones tactiles ≥ 44 px, information jamais portée par la couleur seule, support complet des diacritiques vietnamiens.

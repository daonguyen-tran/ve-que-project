# ADR 0008 — Carte : Leaflet à la demande, positions collées depuis Google Maps

- **Statut** : accepté
- **Date** : 24/11/2026

## Contexte

Le module M4 demande une carte des étapes, des trajets et des idées d'une ville, la saisie
de positions GPS et un lien « Ouvrir dans Google Maps ». La carte hors ligne a été écartée
au cadrage (trop coûteuse) ; hors ligne, une liste doit la remplacer.

## Décision

- **Leaflet + react-leaflet + tuiles OpenStreetMap**, comme prévu au cahier des charges :
  gratuit, sans clé. Leaflet est chargé **à la demande** (`React.lazy`) : il n'alourdit pas
  l'ouverture de l'appli, et le _service worker_ met son code en cache comme le reste.
- La carte est une **troisième vue du planning** (`?vue=carte`), avec une zone à la fois :
  tout le voyage, ou une ville (`&ville=`). Le calcul de ce qu'il faut dessiner
  (`map-model.ts`) ne dépend pas de Leaflet ; la liste des lieux sous la carte, et son
  remplaçant hors ligne, utilisent le même modèle.
- **Saisie d'une position** : un champ texte qui accepte des coordonnées (point ou virgule
  décimale) ou un lien Google Maps / OpenStreetMap (`parseLocation`, dans le domaine). C'est
  le geste le plus rapide sur téléphone : appui long dans Google Maps, copier, coller. Les
  liens courts `maps.app.goo.gl` ne contiennent pas la position : le message le dit.
  En complément, un sélecteur sur carte, avec recherche d'adresse.
- **Recherche d'adresse : Nominatim** (géocodeur d'OpenStreetMap), derrière une interface
  `Geocoder` pour pouvoir en changer. Sa politique d'usage interdit l'autocomplétion : on ne
  cherche que sur action explicite, limité au Vietnam.
- **Google Maps** : lien universel `maps/search/?api=1&query=…` (ouvre l'appli sur Android),
  avec la position si elle existe, sinon l'adresse en vietnamien, l'adresse, puis le nom.

- **Plein écran** : le cadre de la carte passe en `position: fixed` (l'état est dans l'URL,
  `&plein=1`, pour que le bouton retour d'Android le referme) et, quand le navigateur le
  permet, l'API Fullscreen masque aussi ses barres. Les deux restent synchronisés.
- **Recherche** : d'abord dans les lieux du voyage (toutes zones, sans accents), puis, sur
  demande, une adresse via le même `Geocoder`, montrée par un repère provisoire.

## Conséquences

- Hors ligne, plus de fond de carte : la liste reste, avec les liens Google Maps (utilisables
  hors ligne si la zone a été téléchargée dans l'appli Google Maps).
- Les tuiles OpenStreetMap sont soumises à leur politique d'usage : usage personnel, faible
  volume, attribution affichée. Pour un usage plus large, il faudrait un fournisseur de tuiles.

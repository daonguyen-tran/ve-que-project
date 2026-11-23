import { useMediaQuery } from './use-media-query';

/**
 * Ce que l'appareil sait faire. **Seul endroit** où l'on décide qu'une fonctionnalité dépend
 * du PC ou du téléphone.
 *
 * Règles :
 * - on teste des **capacités** (souris, largeur d'écran, GPS), jamais le type d'appareil ni
 *   le navigateur : un PC peut être tactile, une tablette avoir une souris ;
 * - on **adapte plutôt qu'on retire** : si le glisser-déposer n'existe qu'avec une souris, le
 *   mobile doit proposer un autre moyen (un bouton « Déplacer ») d'arriver au même résultat ;
 * - la simple mise en page (une ou plusieurs colonnes) se fait en CSS (`lg:`), pas ici.
 */
export function useCapabilities() {
  const finePointer = useMediaQuery('(pointer: fine)');
  const wideScreen = useMediaQuery('(min-width: 1024px)');

  return {
    /** Glisser-déposer à la souris (planning sur PC). */
    canDragAndDrop: finePointer,
    /** Vues denses sur plusieurs colonnes (semaine du planning). */
    canShowDenseViews: wideScreen,
    /** Position GPS (capture d'un lieu, distance des idées). */
    canLocate: typeof navigator !== 'undefined' && 'geolocation' in navigator,
  };
}

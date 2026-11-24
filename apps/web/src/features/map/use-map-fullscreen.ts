import { useEffect, type RefObject } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

const PARAM = 'plein';

/**
 * Mode plein écran de la carte.
 *
 * Deux mécanismes complémentaires :
 * - **dans l'appli** : le cadre de la carte passe en `position: fixed` par-dessus tout (barre
 *   d'onglets comprise). L'état est dans l'URL (`&plein=1`, ajouté à l'historique) : le bouton
 *   retour d'Android ferme le plein écran au lieu de quitter le planning ;
 * - **dans le navigateur**, quand c'est possible : l'API Fullscreen masque aussi la barre
 *   d'adresse et la barre d'état. Elle exige un geste de l'utilisateur, d'où l'appel direct
 *   dans `enter` (et non dans un effet). Si le navigateur la refuse (iPhone), le premier
 *   mécanisme suffit.
 *
 * Les deux restent synchronisés : quitter le plein écran du navigateur (Échap sur PC, geste
 * retour sur Android) referme aussi celui de l'appli, et inversement.
 */
export function useMapFullscreen(frame: RefObject<HTMLElement | null>) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const expanded = params.get(PARAM) === '1';
  // Entrée posée par `enter` : on peut alors revenir en arrière dans l'historique.
  const pushedByUs = (location.state as { mapFullscreen?: boolean } | null)?.mapFullscreen === true;

  function enter() {
    const next = new URLSearchParams(params);
    next.set(PARAM, '1');
    navigate({ search: next.toString() }, { state: { mapFullscreen: true } });
    frame.current?.requestFullscreen?.().catch(() => {
      // Refusé ou non pris en charge : le plein écran de l'appli suffit.
    });
  }

  function exit() {
    if (pushedByUs) {
      navigate(-1);
    } else {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete(PARAM);
          return next;
        },
        { replace: true },
      );
    }
  }

  // Fermé par l'appli (bouton, retour) alors que le navigateur est encore en plein écran.
  useEffect(() => {
    if (!expanded && document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, [expanded]);

  // Fermé par le navigateur (Échap, geste retour) : on ferme aussi celui de l'appli.
  useEffect(() => {
    if (!expanded) return;
    let wasFullscreen = Boolean(document.fullscreenElement);
    const onChange = () => {
      const now = Boolean(document.fullscreenElement);
      if (wasFullscreen && !now) exit();
      wasFullscreen = now;
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `exit` lit l'URL courante.
  }, [expanded]);

  // Pendant le plein écran : la page dessous ne défile plus, et Échap referme (quand le
  // navigateur n'est pas lui-même en plein écran, sinon c'est lui qui gère Échap).
  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      const popupOpen = frame.current?.querySelector('.leaflet-popup');
      if (event.key === 'Escape' && !document.fullscreenElement && !popupOpen) exit();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `exit` lit l'URL courante.
  }, [expanded, frame]);

  // On quitte la vue (lien « Voir la fiche ») : on ne laisse pas le navigateur en plein écran.
  useEffect(
    () => () => {
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    },
    [],
  );

  return { expanded, enter, exit };
}

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Vrai quand la media query CSS correspond, et se met à jour en direct (rotation de l'écran,
 * redimensionnement de la fenêtre, branchement d'une souris).
 *
 * `useSyncExternalStore` est l'API React prévue pour s'abonner à une source externe : elle
 * évite les rendus incohérents qu'on aurait avec un `useState` + `useEffect`.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

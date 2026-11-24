import { useSyncExternalStore } from 'react';

/*
 * État de la connexion, tenu à jour par les événements `online` / `offline` du navigateur.
 *
 * `navigator.onLine` ne garantit pas qu'internet répond (un Wi-Fi d'hôtel sans accès passe pour
 * « en ligne ») ; il dit en revanche à coup sûr quand on est hors ligne, ce qui suffit pour
 * remplacer la carte par une liste (F-4.5).
 */
function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}

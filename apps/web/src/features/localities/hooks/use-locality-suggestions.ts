import { useEffect, useMemo, useState } from 'react';
import { mergeSuggestions, searchKey, type LocalitySuggestion } from '@ve-que/domain';
import {
  photonLocalitySearch,
  type OnlineLocalitySearch,
} from '@/infrastructure/geocoding/photon-locality-search';
import { useOnlineStatus } from '@/shared/lib/use-online-status';
import { suggestBuiltinLocalities } from '../sources/builtin-localities';
import { suggestSavedLocalities } from '../sources/saved-localities';
import { useSavedLocalities } from './use-localities';

/** Lettres minimum avant d'interroger le service en ligne. */
const ONLINE_MIN_LENGTH = 3;
/** Attente après la dernière frappe avant d'interroger le service en ligne. */
const ONLINE_DEBOUNCE_MS = 300;

export type OnlineState = 'idle' | 'loading' | 'done' | 'offline' | 'error';

export interface LocalitySuggestions {
  saved: LocalitySuggestion[];
  builtin: LocalitySuggestion[];
  online: LocalitySuggestion[];
  onlineState: OnlineState;
}

interface OnlineResult {
  query: string;
  state: 'done' | 'error';
  results: LocalitySuggestion[];
}

/**
 * Suggestions de localités pour le champ « Nom » d'une étape, depuis les trois sources :
 *
 * 1. « mes lieux » et la liste intégrée : immédiates et hors ligne (calculées à chaque frappe) ;
 * 2. le service en ligne : seulement avec du réseau, à partir de 3 lettres, 300 ms après la
 *    dernière frappe (anti-rebond, pour ménager le serveur public). La requête précédente est
 *    annulée (`AbortController`) quand on continue de taper.
 *
 * Une même ville proposée par plusieurs sources n'apparaît qu'une fois, dans la première
 * (`mergeSuggestions`) : mes lieux, puis la liste intégrée, puis le service en ligne.
 *
 * `online` est injectable (motif *Strategy*) : les tests passent une fausse recherche.
 */
export function useLocalitySuggestions(
  query: string,
  {
    enabled = true,
    online = photonLocalitySearch,
  }: { enabled?: boolean; online?: OnlineLocalitySearch } = {},
): LocalitySuggestions {
  const saved = useSavedLocalities();
  const isOnline = useOnlineStatus();
  const trimmed = query.trim();
  const wantsOnline = enabled && searchKey(trimmed).length >= ONLINE_MIN_LENGTH;
  const [remote, setRemote] = useState<OnlineResult | null>(null);

  useEffect(() => {
    if (!wantsOnline || !isOnline) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      online.search(trimmed, controller.signal).then(
        (results) => setRemote({ query: trimmed, state: 'done', results }),
        () => {
          if (!controller.signal.aborted)
            setRemote({ query: trimmed, state: 'error', results: [] });
        },
      );
    }, ONLINE_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, wantsOnline, isOnline, online]);

  return useMemo(() => {
    // L'état en ligne est déduit, pas stocké : la réponse n'est valable que pour la requête
    // qui l'a produite. Tant qu'elle n'est pas arrivée pour la requête actuelle, on « cherche ».
    const current = remote?.query === trimmed ? remote : null;
    const onlineState: OnlineState = !wantsOnline
      ? 'idle'
      : !isOnline
        ? 'offline'
        : (current?.state ?? 'loading');
    const [savedGroup, builtinGroup, onlineGroup] = mergeSuggestions(
      suggestSavedLocalities(trimmed, saved ?? []),
      suggestBuiltinLocalities(trimmed),
      onlineState === 'done' ? (current?.results ?? []) : [],
    );
    return {
      saved: savedGroup ?? [],
      builtin: builtinGroup ?? [],
      online: onlineGroup ?? [],
      onlineState,
    };
  }, [trimmed, saved, remote, wantsOnline, isOnline]);
}

import { MapPin, Search, X } from 'lucide-react';
import { useId, useMemo, useRef, useState } from 'react';
import { searchKey, type GeoPoint, type LocalitySuggestion } from '@ve-que/domain';
import { useLocalitySuggestions } from '@/features/localities/hooks/use-locality-suggestions';
import { STOP_KIND_STYLE } from '@/features/itinerary/stop-style';
import type { Geocoder, GeocodingResult } from '@/infrastructure/geocoding/geocoder';
import type { OnlineLocalitySearch } from '@/infrastructure/geocoding/photon-locality-search';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { searchPlaces, type SearchEntry } from '../map-search';

type AddressSearch =
  | { state: 'idle' }
  | { state: 'loading'; query: string }
  | { state: 'done'; query: string; results: GeocodingResult[] }
  | { state: 'error'; query: string };

/**
 * Une ligne de la liste de résultats : un lieu du voyage, une localité suggérée (ville,
 * village, île), l'action « chercher l'adresse », une adresse.
 */
type Option =
  | { kind: 'place'; entry: SearchEntry }
  | { kind: 'locality'; suggestion: LocalitySuggestion & { location: GeoPoint } }
  | { kind: 'address-search'; query: string }
  | { kind: 'address'; result: GeocodingResult };

/**
 * Barre de recherche de la carte (combobox ARIA), en trois temps :
 *
 * 1. les lieux du voyage (instantané, hors ligne compris) ;
 * 2. les localités, comme pour le nom d'une étape (`useLocalitySuggestions`) : mes lieux et la
 *    liste intégrée hors ligne, puis Photon en ligne au fil de la frappe. Une localité déjà
 *    présente comme étape du voyage n'est pas proposée deux fois ;
 * 3. en ligne, une dernière ligne propose de chercher l'adresse précise dans OpenStreetMap
 *    (Nominatim) — seulement sur demande, comme l'exige sa politique d'usage.
 *
 * Choisir une localité centre la carte dessus, comme une adresse trouvée.
 */
export function MapSearch({
  entries,
  online,
  geocoder,
  localitySearch,
  onSelectPlace,
  onSelectAddress,
}: {
  entries: SearchEntry[];
  online: boolean;
  geocoder: Geocoder;
  /** Recherche de localités en ligne (Photon par défaut ; remplaçable dans les tests). */
  localitySearch?: OnlineLocalitySearch;
  onSelectPlace: (entry: SearchEntry) => void;
  onSelectAddress: (result: GeocodingResult) => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [address, setAddress] = useState<AddressSearch>({ state: 'idle' });

  const trimmed = query.trim();
  const places = useMemo(() => searchPlaces(entries, trimmed), [entries, trimmed]);
  const localitySuggestions = useLocalitySuggestions(trimmed, {
    // La recherche en ligne suit l'état réseau de la carte ; les sources locales restent actives.
    enabled: open && online,
    online: localitySearch,
  });
  const localities = useMemo(() => {
    // Une étape déjà placée sur la carte suffit : pas de « Hoi An » en double. Sans position,
    // on garde la ville connue, qui permet, elle, de centrer la carte.
    const stopNames = new Set(
      entries
        .filter((entry) => entry.place.tone === 'stop' && entry.place.point)
        .map((entry) => searchKey(entry.place.title)),
    );
    return [
      ...localitySuggestions.saved,
      ...localitySuggestions.builtin,
      ...localitySuggestions.online,
    ]
      .filter((s): s is LocalitySuggestion & { location: GeoPoint } => s.location !== null)
      .filter((s) => !stopNames.has(searchKey(s.name)));
  }, [entries, localitySuggestions]);
  const addressResults =
    address.state === 'done' && address.query === trimmed ? address.results : [];
  const options: Option[] = [
    ...places.map((entry): Option => ({ kind: 'place', entry })),
    ...localities.map((suggestion): Option => ({ kind: 'locality', suggestion })),
    ...(online && trimmed.length >= 3 && addressResults.length === 0
      ? [{ kind: 'address-search', query: trimmed } as const]
      : []),
    ...addressResults.map((result): Option => ({ kind: 'address', result })),
  ];
  const showList = open && trimmed.length > 0;
  const activeIndex = Math.min(active, options.length - 1);

  async function searchAddress(text: string) {
    setAddress({ state: 'loading', query: text });
    try {
      setAddress({ state: 'done', query: text, results: await geocoder.search(text) });
    } catch {
      setAddress({ state: 'error', query: text });
    }
  }

  function choose(option: Option | undefined) {
    if (!option) return;
    if (option.kind === 'address-search') {
      void searchAddress(option.query);
      return;
    }
    if (option.kind === 'place') onSelectPlace(option.entry);
    else if (option.kind === 'locality') onSelectAddress(localityAsResult(option.suggestion));
    else onSelectAddress(option.result);
    setOpen(false);
    input.current?.blur();
  }

  const optionId = (index: number) => `${id}-option-${index}`;

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <input
          ref={input}
          type="text"
          role="combobox"
          aria-label={t.map.search.label}
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList && options.length > 0 ? optionId(activeIndex) : undefined}
          placeholder={t.map.search.placeholder}
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          // Différé : un clic sur une ligne de la liste doit être pris en compte avant la fermeture.
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              setOpen(true);
              setActive((index) => Math.min(index + 1, options.length - 1));
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              choose(options[activeIndex]);
            } else if (event.key === 'Escape' && (open || query)) {
              // Échap ferme d'abord la liste, sans quitter le plein écran.
              event.stopPropagation();
              if (open) setOpen(false);
              else setQuery('');
            }
          }}
          className="border-line bg-surface placeholder:text-muted focus-visible:outline-laque min-h-11 w-full rounded-xl border pr-11 pl-10 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1"
        />
        {query && (
          <button
            type="button"
            aria-label={t.map.search.clear}
            onClick={() => {
              setQuery('');
              setAddress({ state: 'idle' });
              input.current?.focus();
            }}
            className="text-muted hover:text-ink absolute top-0 right-0 flex size-11 items-center justify-center"
          >
            <X className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
          </button>
        )}
      </div>

      {showList && (
        <div className="border-line bg-surface absolute inset-x-0 top-full z-[1001] mt-1.5 max-h-[50dvh] overflow-y-auto rounded-xl border shadow-[0_10px_30px_-8px_rgb(28_25_23/0.35)]">
          <ul
            id={`${id}-list`}
            role="listbox"
            aria-label={t.map.search.results}
            className="m-0 list-none p-1"
          >
            {options.map((option, index) => (
              <li
                key={optionKey(option)}
                id={optionId(index)}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
                  index === activeIndex && 'bg-ground',
                )}
              >
                <OptionContent option={option} />
              </li>
            ))}
          </ul>
          <SearchStatus
            places={places.length + localities.length}
            address={address}
            query={trimmed}
            searchingLocalities={localitySuggestions.onlineState === 'loading'}
          />
        </div>
      )}
    </div>
  );
}

/** Clé React stable d'une ligne. */
function optionKey(option: Option): string {
  if (option.kind === 'place') return option.entry.place.id;
  if (option.kind === 'locality') return option.suggestion.key;
  if (option.kind === 'address') return `${option.result.point.lat},${option.result.point.lng}`;
  return 'address-search';
}

/** Une localité choisie se montre comme une adresse trouvée : un repère et son nom. */
function localityAsResult(
  suggestion: LocalitySuggestion & { location: GeoPoint },
): GeocodingResult {
  const label =
    suggestion.vietnameseName && suggestion.vietnameseName !== suggestion.name
      ? `${suggestion.name} (${suggestion.vietnameseName})`
      : suggestion.name;
  return { label, point: suggestion.location, kind: suggestion.kind };
}

function OptionContent({ option }: { option: Option }) {
  if (option.kind === 'locality') {
    const { suggestion } = option;
    const { icon: KindIcon, label: kindLabel } = STOP_KIND_STYLE[suggestion.kind];
    return (
      <>
        <KindIcon
          className="text-muted size-[18px] shrink-0"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-medium">{suggestion.name}</span>
          <span lang="vi" className="text-muted truncate text-[13px]">
            {[
              suggestion.vietnameseName !== suggestion.name ? suggestion.vietnameseName : null,
              suggestion.detail,
              kindLabel,
              t.map.search.sources[suggestion.source],
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      </>
    );
  }
  if (option.kind === 'address-search') {
    return (
      <>
        <Search className="text-laque size-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
        <span className="text-laque text-[15px] font-medium">
          {t.map.search.address(option.query)}
        </span>
      </>
    );
  }
  if (option.kind === 'address') {
    return (
      <>
        <MapPin className="text-muted size-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
        <span className="text-ink-soft line-clamp-2 text-sm">{option.result.label}</span>
      </>
    );
  }
  const { place, zoneName } = option.entry;
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'size-3 shrink-0 rounded-full',
          place.tone === 'stop' && 'rounded-full',
          place.tone === 'must' && 'bg-laque',
          place.tone === 'idea' && 'border-laque border-2',
          place.tone === 'planned' && 'bg-success',
          place.tone === 'lodging' && 'bg-ink rounded-[4px]',
        )}
        style={
          place.tone === 'stop'
            ? { background: `var(--color-stop-${place.stopColor ?? 'indigo'})` }
            : undefined
        }
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[15px] font-medium">{place.title}</span>
        <span className="text-muted truncate text-[13px]">
          {[zoneName, place.subtitle, place.point ? null : t.map.search.withoutPosition]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </span>
    </>
  );
}

/** Messages sous la liste (et annonce du nombre de résultats aux lecteurs d'écran). */
function SearchStatus({
  places,
  address,
  query,
  searchingLocalities,
}: {
  places: number;
  address: AddressSearch;
  query: string;
  searchingLocalities: boolean;
}) {
  const current = address.state !== 'idle' && address.query === query ? address : null;
  const message =
    current?.state === 'loading'
      ? t.map.search.searching
      : current?.state === 'error'
        ? t.map.search.failed
        : current?.state === 'done' && current.results.length === 0
          ? t.map.search.noAddress
          : searchingLocalities
            ? t.localities.searching
            : places === 0 && !current
              ? t.map.search.noMatch
              : null;
  return (
    <>
      {message && <p className="text-muted m-0 px-4 pt-1 pb-3 text-sm">{message}</p>}
      <span role="status" className="sr-only">
        {t.map.search.count(places + (current?.state === 'done' ? current.results.length : 0))}
      </span>
    </>
  );
}

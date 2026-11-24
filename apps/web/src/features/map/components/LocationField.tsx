import { ExternalLink, MapPin, Search } from 'lucide-react';
import { lazy, Suspense, useState, type ComponentProps } from 'react';
import { createPortal } from 'react-dom';
import { formatLocation, googleMapsUrl, parseLocation, type GeoPoint } from '@ve-que/domain';
import {
  nominatimGeocoder,
  type Geocoder,
  type GeocodingResult,
} from '@/infrastructure/geocoding/geocoder';
import { t } from '@/shared/i18n';
import { useOnlineStatus } from '@/shared/lib/use-online-status';
import { Button } from '@/shared/ui/Button';
import { TextField } from '@/shared/ui/form/fields';
import { Sheet } from '@/shared/ui/Sheet';

const PickerMap = lazy(() => import('./PickerMap'));

/**
 * Champ « Position sur la carte » des fiches (étape, hébergement, idée, élément du programme).
 *
 * Trois façons de renseigner une position, de la plus rapide à la plus visuelle :
 * coller des coordonnées ou un lien Google Maps ; chercher une adresse ; toucher la carte.
 * Le champ reste un simple texte pour le formulaire (validé par `locationFieldSchema`).
 */
export function LocationField({
  value,
  error,
  inputProps,
  onPick,
  center,
  geocoder = nominatimGeocoder,
}: {
  /** Texte actuel du champ (surveillé par le formulaire). */
  value: string;
  error?: string;
  /** Résultat de `register('location')`. */
  inputProps: ComponentProps<'input'>;
  onPick: (point: GeoPoint) => void;
  /** Où ouvrir la carte s'il n'y a pas encore de position (l'étape, par exemple). */
  center?: GeoPoint | null;
  geocoder?: Geocoder;
}) {
  const online = useOnlineStatus();
  const [picking, setPicking] = useState(false);
  const parsed = parseLocation(value);
  const current = parsed.ok ? parsed.value : null;
  const mapsUrl = current
    ? googleMapsUrl({ address: '', vietnamese: '', location: current })
    : null;

  return (
    <div className="flex flex-col gap-2">
      <TextField
        label={t.map.location.label}
        labelAside={t.common.optional}
        placeholder={t.map.location.placeholder}
        hint={error ? undefined : t.map.location.hint}
        error={error}
        autoComplete="off"
        spellCheck={false}
        {...inputProps}
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button
          variant="secondary"
          onClick={() => setPicking(true)}
          disabled={!online}
          title={online ? undefined : t.map.location.pickOffline}
          className="min-h-11 px-3.5 text-sm"
        >
          <MapPin className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
          {t.map.location.pick}
        </Button>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-laque inline-flex min-h-11 items-center gap-1 text-sm font-medium no-underline"
          >
            {t.map.openInGoogleMaps}
            <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </a>
        )}
      </div>
      {!online && <p className="text-muted m-0 text-[13px]">{t.map.location.pickOffline}</p>}

      {/*
       * Le sélecteur est rendu hors du formulaire (portail) : un <dialog> dans un <form> ferait
       * de ses boutons des boutons d'envoi, et une recherche y déclencherait l'enregistrement.
       */}
      {picking &&
        createPortal(
          <LocationPickerSheet
            initial={current}
            center={center ?? null}
            geocoder={geocoder}
            onClose={() => setPicking(false)}
            onConfirm={(point) => {
              onPick(point);
              setPicking(false);
            }}
          />,
          document.body,
        )}
    </div>
  );
}

function LocationPickerSheet({
  initial,
  center,
  geocoder,
  onClose,
  onConfirm,
}: {
  initial: GeoPoint | null;
  center: GeoPoint | null;
  geocoder: Geocoder;
  onClose: () => void;
  onConfirm: (point: GeoPoint) => void;
}) {
  const [point, setPoint] = useState<GeoPoint | null>(initial);
  const [target, setTarget] = useState<GeoPoint | null>(null);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'done'; results: GeocodingResult[] }
    | { state: 'error' }
  >({ state: 'idle' });

  async function runSearch() {
    if (!query.trim()) return;
    setSearch({ state: 'loading' });
    try {
      setSearch({ state: 'done', results: await geocoder.search(query.trim()) });
    } catch {
      setSearch({ state: 'error' });
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t.map.location.pickerTitle}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button disabled={!point} onClick={() => point && onConfirm(point)}>
            {t.map.location.confirm}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-muted m-0 text-[15px]">{t.map.location.pickerHint}</p>
        <div role="search" className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void runSearch();
              }
            }}
            aria-label={t.map.location.search}
            placeholder={t.map.location.search}
            enterKeyHint="search"
            className="border-line bg-surface focus-visible:outline-laque min-h-12 min-w-0 flex-1 rounded-xl border px-3.5 text-[15px] focus-visible:outline-2"
          />
          <Button
            variant="secondary"
            onClick={() => void runSearch()}
            aria-label={t.map.location.searchButton}
            className="min-h-12 w-12 shrink-0 px-0"
          >
            <Search className="size-5" strokeWidth={1.9} aria-hidden="true" />
          </Button>
        </div>
        <SearchResults
          search={search}
          onChoose={(result) => {
            setPoint(result.point);
            setTarget(result.point);
            setSearch({ state: 'idle' });
          }}
        />
        <div className="border-line h-[46dvh] min-h-64 overflow-hidden rounded-xl border">
          <Suspense fallback={<div className="bg-line-soft h-full w-full" />}>
            <PickerMap value={point} center={center} target={target} onChange={setPoint} />
          </Suspense>
        </div>
        <p aria-live="polite" className="text-ink-soft tabular m-0 min-h-5 text-sm">
          {point ? t.map.location.chosen(formatLocation(point)) : ''}
        </p>
      </div>
    </Sheet>
  );
}

function SearchResults({
  search,
  onChoose,
}: {
  search:
    | { state: 'idle' }
    | { state: 'loading' }
    | { state: 'done'; results: GeocodingResult[] }
    | { state: 'error' };
  onChoose: (result: GeocodingResult) => void;
}) {
  if (search.state === 'idle') return null;
  if (search.state === 'loading') {
    return <p className="text-muted m-0 text-sm">{t.map.location.searching}</p>;
  }
  if (search.state === 'error') {
    return (
      <p role="alert" className="text-laque-deep m-0 text-sm">
        {t.map.location.searchFailed}
      </p>
    );
  }
  if (search.results.length === 0) {
    return <p className="text-muted m-0 text-sm">{t.map.location.noResult}</p>;
  }
  return (
    <ul className="border-line m-0 list-none overflow-hidden rounded-xl border p-0">
      {search.results.map((result) => (
        <li
          key={`${result.point.lat},${result.point.lng}`}
          className="border-line-soft border-b last:border-b-0"
        >
          <button
            type="button"
            onClick={() => onChoose(result)}
            className="hover:bg-ground min-h-11 w-full px-3.5 py-2.5 text-left text-sm"
          >
            {result.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

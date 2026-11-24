import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import type { MapPlace } from '../map-model';

/** « Voir la fiche » (dans l'appli) et « Google Maps » (F-4.4), pour une bulle ou une ligne. */
export function PlaceLinks({ place, className }: { place: MapPlace; className?: string }) {
  return (
    <span className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}>
      {place.detailTo && (
        <Link to={place.detailTo} className="text-laque text-sm font-medium no-underline">
          {t.map.details}
        </Link>
      )}
      {place.mapsUrl && (
        <a
          href={place.mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-laque inline-flex items-center gap-1 text-sm font-medium no-underline"
        >
          {t.map.googleMapsShort}
          <ExternalLink className="size-3.5" strokeWidth={2} aria-hidden="true" />
        </a>
      )}
    </span>
  );
}

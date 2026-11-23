import { MapPinned, Plus } from 'lucide-react';
import { useState } from 'react';
import { suggestStopDates, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useStops } from '../hooks/use-stops';
import { NightsStrip } from './NightsStrip';
import { StopSheet, type StopSheetTarget } from './StopSheet';
import { StopsTimeline } from './StopsTimeline';

/** Itinéraire du voyage : frise des nuits, liste des étapes et panneau de saisie. */
export function ItineraryOverview({ trip }: { trip: Trip }) {
  const stops = useStops(trip.id);
  const [target, setTarget] = useState<StopSheetTarget | null>(null);

  if (stops === undefined) return null;

  // « Ajouter » propose directement les premières nuits encore libres.
  const openCreate = () => setTarget({ mode: 'create', ...suggestStopDates(trip, stops) });

  return (
    <>
      {stops.length === 0 ? (
        <EmptyState
          icon={<MapPinned className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.stops.emptyTitle}
          body={t.stops.emptyBody}
          actions={<Button onClick={openCreate}>{t.stops.add}</Button>}
        />
      ) : (
        <>
          <NightsStrip trip={trip} stops={stops} />
          <StopsTimeline trip={trip} stops={stops} onOpen={setTarget} />
          <Button variant="secondary" onClick={openCreate} className="self-start">
            <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
            {t.stops.add}
          </Button>
        </>
      )}
      <StopSheet trip={trip} stops={stops} target={target} onClose={() => setTarget(null)} />
    </>
  );
}

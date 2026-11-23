import { MapPinned, Plus } from 'lucide-react';
import { useState } from 'react';
import { suggestStopDates, type Trip } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { useAccommodations, useTransfers } from '../hooks/use-itinerary';
import { useStops } from '../hooks/use-stops';
import { NightsStrip } from './NightsStrip';
import { StopSheet, type StopSheetTarget } from './StopSheet';
import { StopsTimeline } from './StopsTimeline';
import { TransferSheet, type TransferSheetTarget } from './TransferSheet';

/**
 * Itinéraire du voyage : frise des nuits, puis les étapes reliées comme sur une feuille de
 * route, avec leurs trajets.
 *
 * Les nuits sans étape ne sont signalées que par la frise : la liste reste un récapitulatif.
 * Pour en ajouter une, « Ajouter une étape » (en bas) ouvre la fiche sur les premières nuits
 * libres, et son calendrier grise les nuits déjà prises.
 */
export function ItineraryOverview({ trip }: { trip: Trip }) {
  const stops = useStops(trip.id);
  const accommodations = useAccommodations(trip.id);
  const transfers = useTransfers(trip.id);
  const [stopTarget, setStopTarget] = useState<StopSheetTarget | null>(null);
  const [transferTarget, setTransferTarget] = useState<TransferSheetTarget | null>(null);

  if (stops === undefined || accommodations === undefined || transfers === undefined) return null;

  // « Ajouter » propose directement les premières nuits encore libres.
  const openCreate = () => setStopTarget({ mode: 'create', ...suggestStopDates(trip, stops) });

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
          <StopsTimeline
            stops={stops}
            accommodations={accommodations}
            transfers={transfers}
            onOpenTransfer={setTransferTarget}
          />
          <Button variant="secondary" onClick={openCreate} className="self-start">
            <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
            {t.stops.add}
          </Button>
        </>
      )}
      <StopSheet
        trip={trip}
        stops={stops}
        target={stopTarget}
        onClose={() => setStopTarget(null)}
      />
      <TransferSheet trip={trip} target={transferTarget} onClose={() => setTransferTarget(null)} />
    </>
  );
}

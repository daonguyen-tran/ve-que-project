import { useLiveQuery } from 'dexie-react-hooks';
import { BedDouble, ChevronRight, ExternalLink, MapPinOff, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  formatMoney,
  sortStops,
  stopNights,
  stopTransitions,
  type Accommodation,
  type Stop,
} from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { StopProgram } from '@/features/planning/components/StopProgram';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { t } from '@/shared/i18n';
import { formatDateRange } from '@/shared/lib/format-date';
import { Amount } from '@/shared/ui/Amount';
import { Button, ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import {
  AccommodationSheet,
  type AccommodationSheetTarget,
} from '../components/AccommodationSheet';
import { BookingBadge } from '../components/BookingBadge';
import { StopSheet, type StopSheetTarget } from '../components/StopSheet';
import { TransferSheet, type TransferSheetTarget } from '../components/TransferSheet';
import { TransferSlot } from '../components/TransferSlot';
import { useAccommodations, useTransfers } from '../hooks/use-itinerary';
import { useStops } from '../hooks/use-stops';

/**
 * Fiche d'une étape : nom à montrer sur place, hébergements, trajets d'arrivée et de départ,
 * puis le programme de ses journées (où l'on ajoute les activités), et les notes.
 */
export function StopDetailPage() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const repositories = useRepositories();
  const stop = useLiveQuery(
    async () => (stopId ? ((await repositories.stops.getById(stopId)) ?? null) : null),
    [repositories, stopId],
  );
  const trip = useTrip(stop?.tripId);
  const stops = useStops(stop?.tripId);
  const accommodations = useAccommodations(stop?.tripId);
  const transfers = useTransfers(stop?.tripId);

  const [stopTarget, setStopTarget] = useState<StopSheetTarget | null>(null);
  const [accommodationTarget, setAccommodationTarget] = useState<AccommodationSheetTarget | null>(
    null,
  );
  const [transferTarget, setTransferTarget] = useState<TransferSheetTarget | null>(null);

  if (stop === undefined) return <PageHeader title="" backTo="/planning" />;
  if (stop === null) {
    return (
      <>
        <PageHeader title={t.stops.title} backTo="/planning" />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <EmptyState
            icon={<MapPinOff className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.stopDetail.notFound}
            body=""
            actions={<ButtonLink to="/planning">{t.stopDetail.back}</ButtonLink>}
          />
        </div>
      </>
    );
  }
  if (!trip || !stops || !accommodations || !transfers)
    return <PageHeader title={stop.name} backTo="/planning" />;

  const own = accommodations.filter((a) => a.stopId === stop.id);
  const transitions = stopTransitions(sortStops(stops), transfers);
  const arrival = transitions.find((tr) => tr.to.id === stop.id);
  const departure = transitions.find((tr) => tr.from.id === stop.id);

  return (
    <>
      <PageHeader
        title={stop.name}
        subtitle={`${formatDateRange(stop.arrivalDate, stop.departureDate)} · ${t.stops.nights(stopNights(stop))}`}
        backTo="/planning"
        action={
          <Button
            variant="quiet"
            onClick={() => setStopTarget({ mode: 'edit', stop })}
            aria-label={t.stops.editTitle}
          >
            <Pencil className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
            <span className="hidden sm:inline">{t.common.edit}</span>
          </Button>
        }
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-4">
        {stop.place.vietnamese && (
          <section className="bg-surface border-line flex flex-col gap-1 rounded-[var(--radius-card)] border px-4 py-3.5">
            <span className="text-muted text-[13px]">{t.stopDetail.showLocal}</span>
            <span
              lang="vi"
              className="text-2xl font-semibold tracking-[-0.01em] [overflow-wrap:anywhere]"
            >
              {stop.place.vietnamese}
            </span>
          </section>
        )}

        <section aria-labelledby="stop-accommodations" className="flex flex-col gap-2.5">
          <h2
            id="stop-accommodations"
            className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]"
          >
            {t.accommodations.title}
          </h2>
          {own.length === 0 ? (
            <p className="text-muted m-0 px-1 text-[15px]">{t.accommodations.emptyBody}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {own.map((accommodation) => (
                <li key={accommodation.id}>
                  <AccommodationCard
                    accommodation={accommodation}
                    onEdit={() => setAccommodationTarget({ mode: 'edit', accommodation })}
                  />
                </li>
              ))}
            </ul>
          )}
          <Button
            variant="secondary"
            onClick={() => setAccommodationTarget({ mode: 'create' })}
            className="self-start"
          >
            <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
            {t.accommodations.add}
          </Button>
        </section>

        <section aria-labelledby="stop-transfers" className="flex flex-col gap-2.5">
          <h2 id="stop-transfers" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
            {t.transfers.title}
          </h2>
          <TransferBlock
            title={t.transfers.arrivalTitle}
            transition={arrival}
            emptyText={t.transfers.noneFirst}
            onOpen={setTransferTarget}
          />
          <TransferBlock
            title={t.transfers.departureTitle}
            transition={departure}
            emptyText={t.transfers.noneLast}
            onOpen={setTransferTarget}
          />
        </section>

        <StopProgram trip={trip} stop={stop} />

        {stop.notes && (
          <section aria-labelledby="stop-notes" className="flex flex-col gap-2">
            <h2 id="stop-notes" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
              {t.stopDetail.notes}
            </h2>
            <p className="text-ink-soft m-0 px-1 text-[15px] leading-relaxed whitespace-pre-line">
              {stop.notes}
            </p>
          </section>
        )}
      </div>

      <StopSheet
        trip={trip}
        stops={stops}
        target={stopTarget}
        onClose={() => setStopTarget(null)}
        onDeleted={() => void navigate('/planning')}
      />
      <AccommodationSheet
        stop={stop}
        target={accommodationTarget}
        onClose={() => setAccommodationTarget(null)}
      />
      <TransferSheet trip={trip} target={transferTarget} onClose={() => setTransferTarget(null)} />
    </>
  );
}

function AccommodationCard({
  accommodation,
  onEdit,
}: {
  accommodation: Accommodation;
  onEdit: () => void;
}) {
  const address = [accommodation.place.address, accommodation.place.vietnamese].filter(Boolean);
  return (
    <div className="border-line bg-surface overflow-hidden rounded-[var(--radius-card)] border">
      <button
        type="button"
        onClick={onEdit}
        aria-label={t.accommodations.edit(accommodation.name)}
        className="hover:bg-ground flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors"
      >
        <BedDouble
          className="text-muted mt-0.5 size-5 shrink-0"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">{accommodation.name}</span>
            <BookingBadge status={accommodation.status} />
          </span>
          {accommodation.price && (
            <span
              className="flex items-baseline gap-2"
              aria-label={formatMoney(accommodation.price)}
            >
              <Amount money={accommodation.price} size="md" />
            </span>
          )}
          {accommodation.bookingRef && (
            <span className="text-muted tabular text-[13px]">
              {t.booking.refShort(accommodation.bookingRef)}
            </span>
          )}
          {address.map((line, index) => (
            <span
              key={line}
              lang={index === 1 ? 'vi' : undefined}
              className="text-ink-soft text-[13px]"
            >
              {line}
            </span>
          ))}
        </span>
        <ChevronRight className="text-muted mt-0.5 size-5 shrink-0" aria-hidden="true" />
      </button>
      {accommodation.url && (
        <a
          href={accommodation.url}
          target="_blank"
          rel="noreferrer"
          className="border-line-soft text-laque flex min-h-11 items-center gap-2 border-t px-4 text-sm font-medium no-underline"
        >
          <ExternalLink className="size-4" strokeWidth={1.9} aria-hidden="true" />
          {t.accommodations.openLink}
        </a>
      )}
    </div>
  );
}

function TransferBlock({
  title,
  transition,
  emptyText,
  onOpen,
}: {
  title: string;
  transition:
    { from: Stop; to: Stop; transfer: Parameters<typeof TransferSlot>[0]['transfer'] } | undefined;
  emptyText: string;
  onOpen: (target: TransferSheetTarget) => void;
}) {
  return (
    <div className="border-line bg-surface flex flex-col gap-1 rounded-[var(--radius-card)] border px-1 py-2">
      <span className="text-muted px-3 pt-1 text-[13px]">
        {transition
          ? `${title} · ${t.transfers.route(transition.from.name, transition.to.name)}`
          : title}
      </span>
      {transition ? (
        <TransferSlot
          from={transition.from}
          to={transition.to}
          transfer={transition.transfer}
          onOpen={() =>
            onOpen({ from: transition.from, to: transition.to, transfer: transition.transfer })
          }
        />
      ) : (
        <p className="text-muted m-0 px-3 pb-1 text-sm">{emptyText}</p>
      )}
    </div>
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import {
  BedDouble,
  ChevronRight,
  ExternalLink,
  MapPinOff,
  NotebookPen,
  Pencil,
  Route,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  formatMoney,
  sortStops,
  stopColorOf,
  stopNights,
  stopTransitions,
  type Accommodation,
  type Stop,
} from '@ve-que/domain';
import { useRepositories } from '@/app/providers/repositories-context';
import { StopProgram } from '@/features/planning/components/StopProgram';
import { useTrip } from '@/features/trips/hooks/use-trips';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatDateRange } from '@/shared/lib/format-date';
import { Amount } from '@/shared/ui/Amount';
import { Button, ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { AddRow, Card, Section } from '@/shared/ui/SectionCard';
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
import { STOP_COLOR_STYLE, STOP_KIND_STYLE } from '../stop-style';

/**
 * Fiche d'une étape : nom à montrer sur place, hébergements, trajets d'arrivée et de départ,
 * puis le programme de ses journées (où l'on ajoute les activités), et les notes.
 *
 * Mise en page : chaque rubrique suit la même grammaire (`Section` > `Card` > `AddRow`, voir
 * `shared/ui/SectionCard`), et la couleur de l'étape sert de repère (nom à montrer sur place,
 * pavés de date du programme).
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

  const color = STOP_COLOR_STYLE[stopColorOf(stop)];

  return (
    <>
      <PageHeader
        wide
        title={stop.name}
        subtitle={[
          STOP_KIND_STYLE[stop.kind].label,
          formatDateRange(stop.arrivalDate, stop.departureDate),
          t.stops.nights(stopNights(stop)),
        ].join(' · ')}
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

      {/*
       * Mobile : une colonne, logistique puis programme puis notes.
       * PC : la logistique et les notes à gauche, le programme (le cœur de la fiche) à droite.
       * L'ordre du DOM reste celui de la lecture sur mobile ; seule la grille déplace les notes.
       */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:items-start lg:gap-x-10">
        <div className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1">
          {stop.place.vietnamese && (
            // Le nom à montrer au chauffeur, sur la teinte de l'étape : le repère de la fiche.
            <div
              className={cn(
                'flex flex-col gap-1 rounded-[var(--radius-card)] px-4 py-3.5',
                color.tint,
                color.ink,
              )}
            >
              <span className="text-[13px] font-medium">{t.stopDetail.showLocal}</span>
              <span
                lang="vi"
                className="text-2xl font-bold tracking-[-0.01em] [overflow-wrap:anywhere]"
              >
                {stop.place.vietnamese}
              </span>
            </div>
          )}

          <Section id="stop-accommodations" icon={BedDouble} title={t.accommodations.title}>
            <Card>
              {own.length === 0 && (
                <p className="text-muted m-0 px-4 py-3.5 text-[15px]">
                  {t.accommodations.emptyBody}
                </p>
              )}
              {own.map((accommodation) => (
                <AccommodationRow
                  key={accommodation.id}
                  accommodation={accommodation}
                  onEdit={() => setAccommodationTarget({ mode: 'edit', accommodation })}
                />
              ))}
              <AddRow
                label={t.accommodations.add}
                onClick={() => setAccommodationTarget({ mode: 'create' })}
              />
            </Card>
          </Section>

          <Section id="stop-transfers" icon={Route} title={t.transfers.title}>
            <Card>
              <TransferRow
                title={t.transfers.arrivalTitle}
                transition={arrival}
                emptyText={t.transfers.noneFirst}
                onOpen={setTransferTarget}
              />
              <TransferRow
                title={t.transfers.departureTitle}
                transition={departure}
                emptyText={t.transfers.noneLast}
                onOpen={setTransferTarget}
              />
            </Card>
          </Section>
        </div>

        <StopProgram
          trip={trip}
          stop={stop}
          className="lg:col-start-2 lg:row-span-2 lg:row-start-1"
        />

        {stop.notes && (
          <Section
            id="stop-notes"
            icon={NotebookPen}
            title={t.stopDetail.notes}
            className="lg:col-start-1 lg:row-start-2"
          >
            <Card>
              <p className="text-ink-soft m-0 px-4 py-3.5 text-[15px] leading-relaxed whitespace-pre-line">
                {stop.notes}
              </p>
            </Card>
          </Section>
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

/** Un hébergement, ligne de la carte « Hébergement » : toucher la ligne ouvre sa fiche. */
function AccommodationRow({
  accommodation,
  onEdit,
}: {
  accommodation: Accommodation;
  onEdit: () => void;
}) {
  const address = [accommodation.place.address, accommodation.place.vietnamese].filter(Boolean);
  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={onEdit}
        aria-label={t.accommodations.edit(accommodation.name)}
        className="hover:bg-ground active:bg-ground flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors duration-150"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-base font-semibold [overflow-wrap:anywhere]">
              {accommodation.name}
            </span>
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
          {(address.length > 0 || accommodation.bookingRef) && (
            <span className="text-muted flex flex-col gap-0.5 text-[13px]">
              {address.map((line, index) => (
                <span key={line} lang={index === 1 ? 'vi' : undefined}>
                  {line}
                </span>
              ))}
              {accommodation.bookingRef && (
                <span className="tabular">{t.booking.refShort(accommodation.bookingRef)}</span>
              )}
            </span>
          )}
        </span>
        <ChevronRight className="text-muted mt-0.5 size-5 shrink-0" aria-hidden="true" />
      </button>
      {accommodation.url && (
        <a
          href={accommodation.url}
          target="_blank"
          rel="noreferrer"
          className="text-laque hover:bg-laque-tint flex min-h-11 items-center gap-2 self-start rounded-xl px-4 pb-1 text-sm font-medium no-underline transition-colors"
        >
          <ExternalLink className="size-4" strokeWidth={1.9} aria-hidden="true" />
          {t.accommodations.openLink}
        </a>
      )}
    </div>
  );
}

/** Trajet d'arrivée ou de départ : son libellé, puis le trajet ou l'action pour l'ajouter. */
function TransferRow({
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
    <div className="flex flex-col gap-0.5 px-1 py-2">
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

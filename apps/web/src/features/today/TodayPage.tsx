import { CalendarDays, Luggage, Sunrise } from 'lucide-react';
import { Link } from 'react-router';
import {
  currentDayNumber,
  daysUntilStart,
  tripLength,
  tripPhase,
  tripToday,
  type Trip,
} from '@ve-que/domain';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { t } from '@/shared/i18n';
import { formatDateRange, formatLongDate } from '@/shared/lib/format-date';
import { BrandHeader } from '@/shared/ui/BrandHeader';
import { ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';

/**
 * Écran d'accueil, selon la situation (F-8.1, F-8.2) :
 * aucun voyage → invitation à en créer un ; avant le départ → compte à rebours ;
 * pendant → jour n sur N (le programme complet, `TodayView`, sera branché en phase 3) ;
 * après → voyage terminé.
 */
export function TodayPage() {
  const { activeTrip, isLoading } = useActiveTrip();

  if (isLoading) return <BrandHeader title={t.today.welcomeTitle} />;
  if (!activeTrip) return <NoTrip />;

  const now = new Date();
  switch (tripPhase(activeTrip, now)) {
    case 'upcoming':
      return <BeforeTrip trip={activeTrip} now={now} />;
    case 'ongoing':
      return <DuringTrip trip={activeTrip} now={now} />;
    case 'past':
      return <AfterTrip trip={activeTrip} />;
  }
}

function NoTrip() {
  return (
    <>
      <BrandHeader title={t.today.welcomeTitle} subtitle={t.today.welcomeSubtitle} />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <EmptyState
          icon={<Luggage className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.today.noTripTitle}
          body={t.today.noTripBody}
          actions={
            <>
              <ButtonLink to="/voyages/nouveau">{t.today.noTripAction}</ButtonLink>
              <Link
                to="/apercu"
                className="text-laque min-h-11 content-center text-[15px] font-medium"
              >
                {t.today.previewLink}
              </Link>
            </>
          }
        />
      </div>
    </>
  );
}

function BeforeTrip({ trip, now }: { trip: Trip; now: Date }) {
  return (
    <>
      <BrandHeader
        title={t.today.countdownTitle(daysUntilStart(trip, now))}
        subtitle={`${trip.name} · ${formatDateRange(trip.startDate, trip.endDate)}`}
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <EmptyState
          icon={<CalendarDays className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.planning.stopsTitle}
          body={t.today.upcomingBody}
          actions={<ButtonLink to="/planning">{t.today.upcomingAction}</ButtonLink>}
        />
      </div>
    </>
  );
}

function DuringTrip({ trip, now }: { trip: Trip; now: Date }) {
  const day = currentDayNumber(trip, now) ?? 1;
  return (
    <>
      <BrandHeader
        title={formatLongDate(tripToday(trip, now))}
        subtitle={`${t.today.dayOf(day, tripLength(trip))} · ${trip.name}`}
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <EmptyState
          icon={<Sunrise className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.today.program}
          body={t.today.ongoingBody}
          badge={t.placeholder.phase(3)}
        />
      </div>
    </>
  );
}

function AfterTrip({ trip }: { trip: Trip }) {
  return (
    <>
      <BrandHeader
        title={t.today.pastTitle}
        subtitle={`${trip.name} · ${formatDateRange(trip.startDate, trip.endDate)}`}
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <EmptyState
          icon={<Luggage className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.today.pastTitle}
          body={t.today.pastBody}
          actions={<ButtonLink to="/voyages/nouveau">{t.trips.newTrip}</ButtonLink>}
        />
      </div>
    </>
  );
}

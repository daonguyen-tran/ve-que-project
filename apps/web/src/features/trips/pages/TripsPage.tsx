import { Check, ChevronRight, Luggage, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { t } from '@/shared/i18n';
import { formatDateRange } from '@/shared/lib/format-date';
import { ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { tripStatusLabel } from '../trip-status';

/** Liste de tous les voyages (F-1.2). Le voyage affiché par défaut est signalé. */
export function TripsPage() {
  const { trips, activeTrip, isLoading } = useActiveTrip();
  const now = new Date();

  return (
    <>
      <PageHeader
        title={t.trips.listTitle}
        backTo="/plus"
        action={
          trips.length > 0 && (
            <ButtonLink to="/voyages/nouveau" variant="quiet" aria-label={t.trips.newTrip}>
              <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
              {t.trips.newTripShort}
            </ButtonLink>
          )
        }
      />
      <div className="mx-auto max-w-3xl px-4 py-4">
        {!isLoading && trips.length === 0 ? (
          <EmptyState
            icon={<Luggage className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.trips.noTripsTitle}
            body={t.trips.noTripsBody}
            actions={<ButtonLink to="/voyages/nouveau">{t.trips.newTrip}</ButtonLink>}
          />
        ) : (
          <ul className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
            {trips.map((trip) => {
              const isActive = trip.id === activeTrip?.id;
              return (
                <li key={trip.id} className="border-line-soft border-b last:border-b-0">
                  <Link
                    to={`/voyages/${trip.id}`}
                    className="hover:bg-ground flex min-h-[72px] items-center gap-3 px-4 py-3 text-inherit no-underline transition-colors"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[15px] font-semibold">{trip.name}</span>
                      <span className="text-muted tabular text-[13px]">
                        {formatDateRange(trip.startDate, trip.endDate)} ·{' '}
                        {tripStatusLabel(trip, now)}
                      </span>
                    </span>
                    {isActive && (
                      <span className="text-success flex items-center gap-1 text-[13px] font-medium">
                        <Check className="size-4" strokeWidth={2.2} aria-hidden="true" />
                        {t.trips.displayed}
                      </span>
                    )}
                    <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

import { CalendarDays, Settings2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { tripLength } from '@ve-que/domain';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { ItineraryOverview } from '@/features/itinerary/components/ItineraryOverview';
import { MemberAvatar } from '@/features/trips/components/MemberAvatar';
import { useMembers } from '@/features/trips/hooks/use-trips';
import { t } from '@/shared/i18n';
import { formatDateRange } from '@/shared/lib/format-date';
import { ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { DaysOverview } from '../components/DaysOverview';
import { PlanningViewSwitch } from '../components/PlanningViewSwitch';
import { planningViewFromParam } from '../planning-view';
import { MapView } from '@/features/map/components/MapView';

/**
 * Planning du voyage actif, en deux vues : l'itinéraire (étapes, hébergements, trajets) et le
 * détail jour par jour. La vue choisie est dans l'URL (`?vue=jours`) : le bouton retour d'un
 * jour ramène à la bonne vue, et l'on peut partager le lien.
 *
 * L'itinéraire sert à organiser le voyage (étapes, trajets ; les journées se préparent dans la
 * fiche de chaque étape). « Jour par jour » est un fil chronologique en lecture.
 */
export function PlanningPage() {
  const { activeTrip, isLoading } = useActiveTrip();
  const [searchParams] = useSearchParams();
  const view = planningViewFromParam(searchParams.get('vue'));
  const members = useMembers(activeTrip?.id);

  if (isLoading) return <PageHeader title={t.placeholder.planningTitle} />;

  if (!activeTrip) {
    return (
      <>
        <PageHeader title={t.placeholder.planningTitle} />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <EmptyState
            icon={<CalendarDays className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.trips.noTripsTitle}
            body={t.planning.noTripBody}
            actions={<ButtonLink to="/voyages/nouveau">{t.trips.newTrip}</ButtonLink>}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={activeTrip.name}
        subtitle={t.planning.tripDates(
          formatDateRange(activeTrip.startDate, activeTrip.endDate),
          t.common.days(tripLength(activeTrip)),
        )}
        action={
          <Link
            to="/voyages"
            className="text-laque flex min-h-11 items-center text-[15px] font-medium no-underline"
          >
            {t.trips.change}
          </Link>
        }
      />
      <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-3 pb-28">
        <Link
          to={`/voyages/${activeTrip.id}`}
          className="border-line bg-surface hover:border-muted flex min-h-16 items-center gap-3 rounded-[var(--radius-card)] border px-4 py-3 text-inherit no-underline transition-colors"
        >
          <span className="flex -space-x-2">
            {(members ?? []).slice(0, 5).map((member) => (
              <MemberAvatar
                key={member.id}
                member={member}
                className="ring-surface size-9 text-sm ring-2"
              />
            ))}
          </span>
          <span className="text-muted flex-1 text-sm whitespace-nowrap">
            {t.common.travellers(members?.length ?? 0)}
          </span>
          <span className="text-laque flex items-center gap-1.5 text-sm font-medium">
            <Settings2 className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
            {t.trips.settingsShort}
          </span>
        </Link>

        <PlanningViewSwitch view={view} />
        {view === 'days' && <DaysOverview trip={activeTrip} />}
        {view === 'map' && <MapView trip={activeTrip} />}
        {view === 'itinerary' && <ItineraryOverview trip={activeTrip} />}
      </div>
    </>
  );
}

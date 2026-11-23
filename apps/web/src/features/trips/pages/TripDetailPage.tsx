import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { tripLength } from '@ve-que/domain';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { t } from '@/shared/i18n';
import { formatDateRange } from '@/shared/lib/format-date';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EditTripSheet } from '../components/EditTripSheet';
import { MembersSection } from '../components/MembersSection';
import { useMembers, useTrip, useTripService } from '../hooks/use-trips';
import { tripStatusLabel } from '../trip-status';

/** Fiche d'un voyage : informations, voyageurs, archivage et suppression. */
export function TripDetailPage() {
  const { tripId } = useParams();
  const trip = useTrip(tripId);
  const members = useMembers(tripId);
  const { activeTrip } = useActiveTrip();
  const tripService = useTripService();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (trip === undefined || members === undefined) return <PageHeader title="" backTo="/voyages" />;

  if (trip === null) {
    return (
      <>
        <PageHeader title={t.trips.listTitle} backTo="/voyages" />
        <div className="mx-auto max-w-3xl px-4 py-4">
          <EmptyState
            icon={<Trash2 className="size-5" strokeWidth={1.9} aria-hidden="true" />}
            title={t.trips.notFound}
            body=""
          />
        </div>
      </>
    );
  }

  const isActive = activeTrip?.id === trip.id;
  const details = [
    { label: t.trips.dates, value: formatDateRange(trip.startDate, trip.endDate) },
    { label: t.trips.duration, value: t.common.days(tripLength(trip)) },
    { label: t.trips.currency, value: t.trips.currencies[trip.referenceCurrency] },
  ];

  return (
    <>
      <PageHeader
        title={trip.name}
        subtitle={tripStatusLabel(trip, new Date())}
        backTo="/voyages"
        action={
          <Button variant="quiet" onClick={() => setEditing(true)} aria-label={t.trips.editTitle}>
            <Pencil className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
            {/* Sur téléphone, l'icône seule laisse la place au titre ; l'aria-label reste lu. */}
            <span className="hidden sm:inline">{t.common.edit}</span>
          </Button>
        }
      />

      <div className="mx-auto flex max-w-3xl flex-col gap-7 px-4 py-4">
        {!isActive && !trip.archivedAt && (
          <Button
            onClick={() => void tripService.openTrip(trip.id).then(() => navigate('/planning'))}
            className="self-start"
          >
            {t.trips.openTrip}
          </Button>
        )}

        <section aria-labelledby="trip-details" className="flex flex-col gap-2.5">
          <h2 id="trip-details" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
            {t.trips.detailsTitle}
          </h2>
          <dl className="border-line bg-surface m-0 overflow-hidden rounded-[var(--radius-card)] border">
            {details.map((row) => (
              <div
                key={row.label}
                className="border-line-soft flex min-h-13 items-center justify-between gap-4 border-b px-4 py-3 last:border-b-0"
              >
                <dt className="text-muted text-sm">{row.label}</dt>
                <dd className="tabular m-0 text-right text-[15px] font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <MembersSection tripId={trip.id} members={members} />

        <section aria-labelledby="trip-danger" className="flex flex-col gap-2.5">
          <h2 id="trip-danger" className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
            {t.trips.dangerZone}
          </h2>
          <div className="border-line bg-surface flex flex-col gap-3 rounded-[var(--radius-card)] border p-4">
            <p className="text-muted m-0 text-sm">{t.trips.archiveHint}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => void tripService.setArchived(trip, !trip.archivedAt)}
              >
                {trip.archivedAt ? (
                  <ArchiveRestore className="size-5" strokeWidth={1.9} aria-hidden="true" />
                ) : (
                  <Archive className="size-5" strokeWidth={1.9} aria-hidden="true" />
                )}
                {trip.archivedAt ? t.trips.unarchive : t.trips.archive}
              </Button>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-5" strokeWidth={1.9} aria-hidden="true" />
                {t.trips.delete}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <EditTripSheet trip={trip} open={editing} onClose={() => setEditing(false)} />
      <ConfirmSheet
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t.trips.deleteTitle}
        message={t.trips.deleteMessage(trip.name)}
        confirmLabel={t.trips.delete}
        onConfirm={async () => {
          await tripService.deleteTrip(trip.id);
          await navigate('/voyages');
        }}
      />
    </>
  );
}

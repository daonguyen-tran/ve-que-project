import { useLiveQuery } from 'dexie-react-hooks';
import { Luggage } from 'lucide-react';
import { Link } from 'react-router';
import { useRepositories } from '@/app/providers/repositories-context';
import { t } from '@/shared/i18n';
import { BrandHeader } from '@/shared/ui/BrandHeader';
import { ButtonLink } from '@/shared/ui/Button';
import { EmptyState } from '@/shared/ui/EmptyState';

/**
 * Écran d'accueil.
 *
 * Phase 0 : seul l'état « aucun voyage » est branché sur la base. L'écran complet
 * (`TodayView`) est déjà construit et visible dans l'aperçu ; il sera alimenté par
 * `useTodayViewModel()` en phase 3 (cahier des charges, F-8.1 et F-8.2).
 */
export function TodayPage() {
  const repositories = useRepositories();
  // `useLiveQuery` relance la requête à chaque écriture dans la table : l'écran se met à
  // jour tout seul quand un voyage est créé. `undefined` = requête pas encore terminée.
  const trips = useLiveQuery(() => repositories.trips.listAll(), [repositories]);

  if (trips === undefined) return <BrandHeader title={t.today.welcomeTitle} />;

  return (
    <>
      <BrandHeader title={t.today.welcomeTitle} subtitle={t.today.welcomeSubtitle} />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
        <EmptyState
          icon={<Luggage className="size-5" strokeWidth={1.9} aria-hidden="true" />}
          title={t.today.noTripTitle}
          body={t.today.noTripBody}
          badge={t.placeholder.phase(1)}
          actions={
            <>
              <ButtonLink to="/planning">{t.today.noTripAction}</ButtonLink>
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

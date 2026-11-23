import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Luggage,
  Gift,
  HardDriveDownload,
  ListChecks,
  PiggyBank,
  Settings,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import { isBackupDue } from '@ve-que/domain';
import { Link } from 'react-router';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { useLastExportAt } from '@/features/data/hooks/use-backup';
import { t } from '@/shared/i18n';
import { PageHeader } from '@/shared/ui/PageHeader';

interface MoreEntry {
  label: string;
  icon: LucideIcon;
  phase: number;
  /** Écran du module, une fois livré ; sans `to`, la ligne annonce sa phase. */
  to?: string;
}

/**
 * Modules secondaires, regroupés derrière l'onglet « Plus ». « Mes voyages » est mis en avant ;
 * les autres lignes deviennent des liens (avec un chevron) au fil des phases.
 */
const ENTRIES: readonly MoreEntry[] = [
  { label: t.more.places, icon: BookMarked, phase: 2 },
  { label: t.more.budget, icon: PiggyBank, phase: 2 },
  { label: t.more.family, icon: Gift, phase: 3 },
  { label: t.more.checklist, icon: ListChecks, phase: 3 },
  { label: t.more.journal, icon: BookOpen, phase: 4 },
  { label: t.more.tools, icon: Banknote, phase: 4 },
  { label: t.more.data, icon: HardDriveDownload, phase: 1, to: '/plus/donnees' },
  { label: t.more.settings, icon: Settings, phase: 1 },
];

const ROW = 'border-line-soft flex min-h-14 items-center gap-3 border-b px-4 last:border-b-0';

export function MorePage() {
  const { trips } = useActiveTrip();
  const lastExportAt = useLastExportAt();
  // Rappel discret de sauvegarde (F-15.4), seulement s'il y a quelque chose à perdre.
  const backupDue =
    lastExportAt !== undefined && trips.length > 0 && isBackupDue(lastExportAt, new Date());

  return (
    <>
      <PageHeader title={t.placeholder.moreTitle} />
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-4">
        <Link
          to="/voyages"
          className="border-line bg-surface hover:border-muted flex min-h-14 items-center gap-3 rounded-[var(--radius-card)] border px-4 text-inherit no-underline transition-colors"
        >
          <Luggage className="text-laque size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
          <span className="flex-1 text-[15px] font-medium">{t.more.trips}</span>
          <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
        </Link>
        <ul className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
          {ENTRIES.map(({ label, icon: Icon, phase, to }) => {
            const icon = (
              <Icon className="text-laque size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
            );
            if (!to) {
              return (
                <li key={label} className={ROW}>
                  {icon}
                  <span className="flex-1 text-[15px] font-medium">{label}</span>
                  <span className="text-muted text-[13px]">{t.placeholder.phase(phase)}</span>
                </li>
              );
            }
            const hint = to === '/plus/donnees' && backupDue ? t.data.dueShort : null;
            return (
              <li key={label} className="border-line-soft border-b last:border-b-0">
                <Link
                  to={to}
                  className="hover:bg-ground flex min-h-14 items-center gap-3 px-4 text-inherit no-underline transition-colors"
                >
                  {icon}
                  <span className="flex-1 text-[15px] font-medium">{label}</span>
                  {hint && (
                    <span className="bg-laque-tint text-laque-deep rounded-full px-2.5 py-0.5 text-[13px] font-medium">
                      {hint}
                    </span>
                  )}
                  <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

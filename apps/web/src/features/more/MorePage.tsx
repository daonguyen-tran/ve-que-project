import {
  BookOpen,
  Gift,
  HardDriveDownload,
  ListChecks,
  PiggyBank,
  Settings,
  Banknote,
  type LucideIcon,
} from 'lucide-react';
import { t } from '@/shared/i18n';
import { PageHeader } from '@/shared/ui/PageHeader';

interface MoreEntry {
  label: string;
  icon: LucideIcon;
  phase: number;
}

/**
 * Modules secondaires, regroupés derrière l'onglet « Plus ». Les lignes deviendront des liens
 * (avec un chevron) au fur et à mesure que chaque module sera construit.
 */
const ENTRIES: readonly MoreEntry[] = [
  { label: t.more.budget, icon: PiggyBank, phase: 2 },
  { label: t.more.family, icon: Gift, phase: 3 },
  { label: t.more.checklist, icon: ListChecks, phase: 3 },
  { label: t.more.journal, icon: BookOpen, phase: 4 },
  { label: t.more.tools, icon: Banknote, phase: 4 },
  { label: t.more.data, icon: HardDriveDownload, phase: 1 },
  { label: t.more.settings, icon: Settings, phase: 1 },
];

export function MorePage() {
  return (
    <>
      <PageHeader title={t.placeholder.moreTitle} />
      <div className="mx-auto max-w-3xl px-4 py-4">
        <ul className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
          {ENTRIES.map(({ label, icon: Icon, phase }) => (
            <li
              key={label}
              className="border-line-soft flex min-h-14 items-center gap-3 border-b px-4 last:border-b-0"
            >
              <Icon className="text-laque size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
              <span className="flex-1 text-[15px] font-medium">{label}</span>
              <span className="text-muted text-[13px]">{t.placeholder.phase(phase)}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

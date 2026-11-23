import { Moon, Plus } from 'lucide-react';
import { isOvernight, type Stop, type Transfer } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { formatShortDate } from '@/shared/lib/format-date';
import { TRANSFER_MODE_ICON } from '../transfer-style';
import { BookingBadge } from './BookingBadge';

/**
 * Emplacement du trajet entre deux étapes : le trajet prévu (moyen, jour, heures, statut),
 * ou un bouton discret pour l'ajouter. Affiché dans la liste du planning entre deux étapes,
 * et sur la fiche d'une étape.
 */
export function TransferSlot({
  from,
  to,
  transfer,
  onOpen,
}: {
  from: Stop;
  to: Stop;
  transfer: Transfer | undefined;
  onOpen: () => void;
}) {
  if (!transfer) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-laque hover:bg-laque-tint flex min-h-11 w-full items-center gap-2 rounded-xl px-4 text-left text-sm font-medium transition-colors"
      >
        <Plus className="size-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
        {t.transfers.add(to.name)}
      </button>
    );
  }

  const Icon = TRANSFER_MODE_ICON[transfer.mode];
  const times = [transfer.departTime, transfer.arriveTime].filter(Boolean).join(' → ');
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t.transfers.edit(from.name, to.name)}
      className="hover:bg-surface flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-2 text-left transition-colors"
    >
      <span className="bg-surface border-line flex size-8 shrink-0 items-center justify-center rounded-full border">
        <Icon className="text-ink-soft size-4" strokeWidth={1.9} aria-hidden="true" />
      </span>
      <span className="text-ink-soft tabular flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[13px]">
        <span className="text-ink font-medium">{t.transfers.modes[transfer.mode]}</span>
        <span>· {formatShortDate(transfer.departDate)}</span>
        {times && <span>· {times}</span>}
        {isOvernight(transfer) && (
          <span className="flex items-center gap-1">
            · <Moon className="size-3.5" strokeWidth={2} aria-hidden="true" />
            {t.transfers.overnight(formatShortDate(transfer.arriveDate))}
          </span>
        )}
      </span>
      <BookingBadge status={transfer.status} />
    </button>
  );
}

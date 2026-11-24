import { Moon, Plus } from 'lucide-react';
import { isOvernight, type Stop, type Transfer } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { formatShortDate } from '@/shared/lib/format-date';
import { TRANSFER_MODE_ICON } from '../transfer-style';
import { BookingBadge } from './BookingBadge';

/*
 * Géométrie de la « route » : la ligne pointillée passe sous le pavé de date des cartes
 * d'étape. Ce pavé fait 48 px de large et commence après la bordure (1 px) et le retrait
 * (14 px, px-3.5) de la carte : son axe est à 1 + 14 + 48 / 2 = 39 px du bord. La gouttière
 * ci-dessous fait 78 px de large et centre la ligne à 39 px : elle tombe sous les dates.
 */
const GUTTER = 'relative flex w-[78px] shrink-0 items-center justify-center self-stretch';

/**
 * Tronçon de route entre deux étapes, dans la liste du planning.
 *
 * - Trajet saisi : l'icône du moyen de transport est posée sur la ligne, avec une ligne de
 *   détails (moyen, jour, heures, nuit à bord, statut). Le tout ouvre le trajet.
 * - Trajet manquant : la ligne pâlit et propose « + Trajet vers … » en gris. C'est volontairement
 *   discret : la liste est d'abord un récapitulatif, pas une liste de choses à faire.
 *
 * Toute la largeur est cliquable, sur au moins 48 px de haut (cible tactile confortable).
 */
export function RouteLeg({
  to,
  transfer,
  editLabel,
  onOpen,
}: {
  to: Stop;
  transfer: Transfer | undefined;
  /** Nom accessible quand un trajet existe (« Modifier le trajet Saigon → Hoi An »). */
  editLabel: string;
  onOpen: () => void;
}) {
  if (!transfer) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="group text-muted/80 hover:text-laque flex min-h-12 w-full items-stretch text-left text-[13px] transition-colors"
      >
        <span className={GUTTER} aria-hidden="true">
          <RouteLine faint />
        </span>
        <span className="flex items-center gap-1.5 py-2">
          <Plus className="size-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
          {t.transfers.toStop(to.name)}
        </span>
      </button>
    );
  }

  const Icon = TRANSFER_MODE_ICON[transfer.mode];
  const times = [transfer.departTime, transfer.arriveTime].filter(Boolean).join(' → ');
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={editLabel}
      className="group flex min-h-14 w-full items-stretch text-left"
    >
      <span className={GUTTER} aria-hidden="true">
        <RouteLine />
        <span className="bg-ground border-line group-hover:border-muted relative flex size-8 items-center justify-center rounded-full border transition-colors">
          <Icon className="text-ink-soft size-4" strokeWidth={1.9} />
        </span>
      </span>
      <span className="text-ink-soft tabular flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-0.5 py-2 pr-2 text-[13px]">
        <span className="text-ink font-medium">{t.transfers.modes[transfer.mode]}</span>
        <span>· {formatShortDate(transfer.departDate)}</span>
        {times && <span>· {times}</span>}
        {isOvernight(transfer) && (
          <span className="flex items-center gap-1">
            · <Moon className="size-3.5" strokeWidth={2} aria-hidden="true" />
            {t.transfers.overnight(formatShortDate(transfer.arriveDate))}
          </span>
        )}
        <BookingBadge status={transfer.status} />
      </span>
    </button>
  );
}

/** Ligne pointillée verticale, sur toute la hauteur du tronçon. */
function RouteLine({ faint = false }: { faint?: boolean }) {
  return (
    <span
      className={cn(
        'absolute inset-y-0 left-1/2 -translate-x-px border-l-2 border-dashed',
        faint ? 'border-line' : 'border-muted/50',
      )}
    />
  );
}

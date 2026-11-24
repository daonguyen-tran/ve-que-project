import type { LocalDate } from '@ve-que/domain';
import { cn } from '@/shared/lib/cn';
import { dateParts } from '@/shared/lib/format-date';

/**
 * Pavé de date façon éphéméride : jour abrégé, numéro en grand (`date-block`), mois.
 *
 * C'est le repère commun du planning : la ligne d'une étape (date d'arrivée) et chaque jour
 * du programme d'une étape. Les couleurs viennent de l'appelant (en général la teinte et
 * l'encre de l'étape, voir `STOP_COLOR_STYLE`), ce qui garde ce composant générique.
 *
 * Purement visuel (`aria-hidden`) : l'appelant donne la date en toutes lettres à côté.
 */
export function DateBlock({ date, className }: { date: LocalDate; className?: string }) {
  const parts = dateParts(date);
  return (
    <span
      className={cn('flex w-12 shrink-0 flex-col items-center rounded-xl py-2', className)}
      aria-hidden="true"
    >
      <span className="text-xs">{parts.weekday}</span>
      <span className="tabular text-[22px] leading-none font-bold tracking-[-0.02em]">
        {parts.day}
      </span>
      <span className="text-xs">{parts.month}</span>
    </span>
  );
}

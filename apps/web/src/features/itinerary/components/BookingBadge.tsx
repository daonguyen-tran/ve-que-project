import { Check } from 'lucide-react';
import type { BookingStatus } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';

/**
 * Statut de réservation : « Réservé » en jade avec une coche, « Envisagé » en contour neutre,
 * « Annulé » barré. Le texte porte toujours l'information, la couleur ne fait que la renforcer.
 */
export function BookingBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'booked' && 'bg-member-jade-tint text-member-jade',
        status === 'considered' && 'border-line text-muted border',
        status === 'cancelled' && 'text-muted border-line border line-through',
        className,
      )}
    >
      {status === 'booked' && <Check className="size-3.5" strokeWidth={2.4} aria-hidden="true" />}
      {t.booking[status]}
    </span>
  );
}

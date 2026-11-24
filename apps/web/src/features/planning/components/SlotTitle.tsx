import type { TimeSlot } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { SLOT_ICON } from '../plan-style';

/**
 * Titre d'un créneau : icône + « MATIN » en petites capitales grises, prolongé d'un filet.
 * Volontairement plus petit et plus pâle que les éléments qu'il annonce : c'est un intercalaire,
 * pas un contenu.
 */
export function SlotTitle({ id, slot }: { id: string; slot: TimeSlot }) {
  const Icon = SLOT_ICON[slot];
  return (
    <h3
      id={id}
      className="text-muted m-0 flex min-h-7 items-center gap-2 text-xs font-semibold tracking-[0.06em] uppercase"
    >
      <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
      {t.slots[slot]}
      <span className="bg-line-soft h-px flex-1" aria-hidden="true" />
    </h3>
  );
}

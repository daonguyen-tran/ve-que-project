import type { TimeSlot } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { SLOT_ICON } from '../plan-style';

/** Titre d'un créneau (icône + « Matin »), commun au programme en lecture et en édition. */
export function SlotTitle({ id, slot }: { id: string; slot: TimeSlot }) {
  const Icon = SLOT_ICON[slot];
  return (
    <h3 id={id} className="text-ink-soft m-0 flex items-center gap-2 text-[15px] font-semibold">
      <Icon className="text-muted size-[18px]" strokeWidth={1.9} aria-hidden="true" />
      {t.slots[slot]}
    </h3>
  );
}

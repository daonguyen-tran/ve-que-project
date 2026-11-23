import { TIME_SLOTS, type SlotSummary, type TimeSlot } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';

type MeterState = 'planned' | 'free' | 'empty';

function stateOf(summary: SlotSummary): MeterState {
  if (summary.count === 0) return 'empty';
  return summary.hasFreeTime && summary.count === 1 ? 'free' : 'planned';
}

const SEGMENT: Record<MeterState, string> = {
  planned: 'bg-laque',
  free: 'border-laque border border-dashed bg-laque-tint',
  empty: 'bg-line',
};

/**
 * Trois segments (matin, après-midi, soir) : plein si quelque chose est prévu, en pointillé
 * pour un temps libre, gris si rien. Le libellé accessible dit la même chose en mots.
 */
export function SlotMeter({ summary }: { summary: Record<TimeSlot, SlotSummary> }) {
  const label = TIME_SLOTS.map((slot) => {
    const state = stateOf(summary[slot]);
    const text =
      state === 'empty'
        ? t.plan.slotNothing
        : state === 'free'
          ? t.plan.slotFree
          : t.plan.slotCount(summary[slot].count);
    return t.plan.slotState(t.slots[slot], text);
  }).join(', ');

  return (
    <span role="img" aria-label={label} className="flex shrink-0 gap-1">
      {TIME_SLOTS.map((slot) => (
        <span key={slot} className={cn('h-2 w-5 rounded-full', SEGMENT[stateOf(summary[slot])])} />
      ))}
    </span>
  );
}

/** Légende des segments, affichée une fois au-dessus de la liste des jours. */
export function SlotMeterLegend() {
  const entries: Array<[MeterState, string]> = [
    ['planned', t.plan.legendPlanned],
    ['free', t.plan.legendFree],
    ['empty', t.plan.legendEmpty],
  ];
  return (
    <ul aria-hidden="true" className="text-muted m-0 flex list-none gap-4 p-0 text-[13px]">
      {entries.map(([state, label]) => (
        <li key={state} className="flex items-center gap-1.5">
          <span className={cn('h-2 w-4 rounded-full', SEGMENT[state])} />
          {label}
        </li>
      ))}
    </ul>
  );
}

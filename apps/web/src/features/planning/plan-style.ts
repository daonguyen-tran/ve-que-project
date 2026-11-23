import { Coffee, MapPin, Moon, Sun, Sunrise, Users, type LucideIcon } from 'lucide-react';
import {
  formatCompact,
  formatMoney,
  type Money,
  type PlannedItemKind,
  type PlannedItemStatus,
  type TimeSlot,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';

/** Icône de chaque créneau : le soleil se lève, culmine, laisse place à la lune. */
export const SLOT_ICON: Record<TimeSlot, LucideIcon> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Moon,
};

export const SLOT_OPTIONS = (Object.keys(SLOT_ICON) as TimeSlot[]).map((slot) => ({
  value: slot,
  label: t.slots[slot],
}));

/**
 * Apparence de chaque type d'élément. Le temps libre est volontairement « en creux » (fond du
 * jour, bord pointillé) : c'est un espace laissé vide exprès. Les moments en famille reprennent
 * le jade des villages.
 */
export const KIND_STYLE: Record<
  PlannedItemKind,
  { icon: LucideIcon; label: string; card: string }
> = {
  activity: { icon: MapPin, label: t.plan.kinds.activity, card: 'bg-surface border-line' },
  free_time: {
    icon: Coffee,
    label: t.plan.kinds.free_time,
    card: 'bg-ground border-line border-dashed',
  },
  family: {
    icon: Users,
    label: t.plan.kinds.family,
    card: 'bg-member-jade-tint border-transparent',
  },
};

export const KIND_OPTIONS = (Object.keys(KIND_STYLE) as PlannedItemKind[]).map((kind) => ({
  value: kind,
  label: KIND_STYLE[kind].label,
  icon: KIND_STYLE[kind].icon,
}));

/** Ordre du cycle de vie, tel que proposé dans le formulaire (F-2.8). */
export const STATUS_OPTIONS = (
  ['idea', 'planned', 'booked', 'done', 'cancelled'] as const satisfies readonly PlannedItemStatus[]
).map((status) => ({ value: status, label: t.plan.statuses[status] }));

/** Durées proposées : assez fines pour une visite, jusqu'à la journée entière. */
export const DURATION_OPTIONS = [30, 60, 90, 120, 180, 240, 480] as const;

/** Montant court pour une carte : « 150k ₫ », « 25,00 € ». */
export function formatCost(money: Money): string {
  return money.currency === 'VND' ? `${formatCompact(money)}\u00a0₫` : formatMoney(money);
}

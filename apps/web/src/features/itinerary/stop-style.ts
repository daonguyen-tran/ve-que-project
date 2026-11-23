import { Building2, House, TreePalm, type LucideIcon } from 'lucide-react';
import type { StopKind } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/**
 * Apparence de chaque type d'étape. Les villages (la famille) ont le vert jade ; les villes,
 * l'indigo ; les îles, la sarcelle. Chaque type a aussi son icône et son libellé, pour que la
 * couleur ne soit jamais le seul indice.
 */
export const STOP_KIND_STYLE: Record<
  StopKind,
  { label: string; icon: LucideIcon; fill: string; tint: string; ink: string }
> = {
  city: {
    label: t.stops.kinds.city,
    icon: Building2,
    fill: 'bg-stop-city',
    tint: 'bg-member-indigo-tint',
    ink: 'text-member-indigo',
  },
  village: {
    label: t.stops.kinds.village,
    icon: House,
    fill: 'bg-stop-village',
    tint: 'bg-member-jade-tint',
    ink: 'text-member-jade',
  },
  island: {
    label: t.stops.kinds.island,
    icon: TreePalm,
    fill: 'bg-stop-island',
    tint: 'bg-member-sarcelle-tint',
    ink: 'text-member-sarcelle',
  },
};

export const STOP_KIND_OPTIONS = (Object.keys(STOP_KIND_STYLE) as StopKind[]).map((kind) => ({
  value: kind,
  label: STOP_KIND_STYLE[kind].label,
  icon: STOP_KIND_STYLE[kind].icon,
}));

import { Building2, House, TreePalm, type LucideIcon } from 'lucide-react';
import { STOP_COLORS, type StopColor, type StopKind } from '@ve-que/domain';
import { t } from '@/shared/i18n';

/**
 * Libellé et icône de chaque type d'étape. Le type ne porte plus de couleur : c'est la couleur
 * de l'étape elle-même (choisie par l'utilisateur) qui distingue les étapes entre elles.
 */
export const STOP_KIND_STYLE: Record<StopKind, { label: string; icon: LucideIcon }> = {
  city: { label: t.stops.kinds.city, icon: Building2 },
  village: { label: t.stops.kinds.village, icon: House },
  island: { label: t.stops.kinds.island, icon: TreePalm },
};

export const STOP_KIND_OPTIONS = (Object.keys(STOP_KIND_STYLE) as StopKind[]).map((kind) => ({
  value: kind,
  label: STOP_KIND_STYLE[kind].label,
  icon: STOP_KIND_STYLE[kind].icon,
}));

/**
 * Classes Tailwind de chaque couleur d'étape (jetons `--color-stop-*` de `index.css`).
 * Écrites en entier, et non construites (`bg-stop-${color}`) : Tailwind ne génère que les
 * classes qu'il trouve telles quelles dans le code.
 *
 * - `fill` : aplat (frise, pastilles) ;
 * - `tint` + `ink` : fond clair et texte lisible dessus (dates des cartes, jours pris).
 */
export const STOP_COLOR_STYLE: Record<
  StopColor,
  { label: string; fill: string; tint: string; ink: string }
> = {
  indigo: {
    label: t.stops.colors.indigo,
    fill: 'bg-stop-indigo',
    tint: 'bg-stop-indigo-tint',
    ink: 'text-stop-indigo-ink',
  },
  jade: {
    label: t.stops.colors.jade,
    fill: 'bg-stop-jade',
    tint: 'bg-stop-jade-tint',
    ink: 'text-stop-jade-ink',
  },
  sarcelle: {
    label: t.stops.colors.sarcelle,
    fill: 'bg-stop-sarcelle',
    tint: 'bg-stop-sarcelle-tint',
    ink: 'text-stop-sarcelle-ink',
  },
  ocre: {
    label: t.stops.colors.ocre,
    fill: 'bg-stop-ocre',
    tint: 'bg-stop-ocre-tint',
    ink: 'text-stop-ocre-ink',
  },
  prune: {
    label: t.stops.colors.prune,
    fill: 'bg-stop-prune',
    tint: 'bg-stop-prune-tint',
    ink: 'text-stop-prune-ink',
  },
  lotus: {
    label: t.stops.colors.lotus,
    fill: 'bg-stop-lotus',
    tint: 'bg-stop-lotus-tint',
    ink: 'text-stop-lotus-ink',
  },
  ciel: {
    label: t.stops.colors.ciel,
    fill: 'bg-stop-ciel',
    tint: 'bg-stop-ciel-tint',
    ink: 'text-stop-ciel-ink',
  },
  ardoise: {
    label: t.stops.colors.ardoise,
    fill: 'bg-stop-ardoise',
    tint: 'bg-stop-ardoise-tint',
    ink: 'text-stop-ardoise-ink',
  },
};

export const STOP_COLOR_OPTIONS = STOP_COLORS.map((color) => ({
  value: color,
  ...STOP_COLOR_STYLE[color],
}));

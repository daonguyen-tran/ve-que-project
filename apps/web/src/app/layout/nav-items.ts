import { CalendarDays, Ellipsis, Lightbulb, Sun, Wallet, type LucideIcon } from 'lucide-react';
import { t } from '@/shared/i18n';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** `true` : l'onglet n'est actif que sur l'URL exacte (sinon aussi sur ses sous-pages). */
  end?: boolean;
}

/** Les cinq onglets, partagés par la barre du bas (mobile) et le rail latéral (PC). */
export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: t.nav.today, icon: Sun, end: true },
  { to: '/planning', label: t.nav.planning, icon: CalendarDays },
  { to: '/idees', label: t.nav.ideas, icon: Lightbulb },
  { to: '/depenses', label: t.nav.expenses, icon: Wallet },
  { to: '/plus', label: t.nav.more, icon: Ellipsis },
];

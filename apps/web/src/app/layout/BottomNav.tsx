import { NavLink } from 'react-router';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { NAV_ITEMS } from './nav-items';

/** Barre d'onglets en bas de l'écran, à portée de pouce (mobile uniquement). */
export function BottomNav() {
  return (
    <nav
      aria-label={t.nav.label}
      className="border-line bg-surface pb-safe fixed inset-x-0 bottom-0 z-20 border-t lg:hidden"
    >
      <ul className="m-0 grid h-[68px] list-none grid-cols-5 p-0 px-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-xs no-underline transition-transform duration-150 active:scale-95',
                  isActive ? 'text-laque font-semibold' : 'text-muted',
                )
              }
            >
              <Icon className="size-6" strokeWidth={1.9} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

import { Link, useLocation } from 'react-router';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { isNavItemActive, NAV_ITEMS } from './nav-items';

/** Barre d'onglets en bas de l'écran, à portée de pouce (mobile uniquement). */
export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label={t.nav.label}
      className="border-line bg-surface pb-safe fixed inset-x-0 bottom-0 z-20 border-t lg:hidden"
    >
      <ul className="m-0 grid h-[68px] list-none grid-cols-5 p-0 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex">
              <Link
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-xs no-underline transition-transform duration-150 active:scale-95',
                  isActive ? 'text-laque font-semibold' : 'text-muted',
                )}
              >
                <Icon className="size-6" strokeWidth={1.9} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

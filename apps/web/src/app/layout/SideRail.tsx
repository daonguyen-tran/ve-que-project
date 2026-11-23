import { Link, useLocation } from 'react-router';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { isNavItemActive, NAV_ITEMS } from './nav-items';

/**
 * Rail de navigation sur grand écran (PC, planification). Il porte la couleur de marque
 * sur toute sa hauteur : c'est le bandeau laque du mobile, tourné à la verticale.
 */
export function SideRail() {
  const { pathname } = useLocation();
  return (
    <aside className="bg-laque text-on-laque sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 px-3 py-6 lg:flex">
      <span className="px-3 text-lg font-bold tracking-[-0.01em]">{t.app.name}</span>
      <nav aria-label={t.nav.label}>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavItemActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] no-underline transition-colors duration-150',
                    isActive
                      ? 'bg-on-laque text-laque-deep font-semibold'
                      : 'text-on-laque-muted hover:bg-laque-deep hover:text-on-laque',
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

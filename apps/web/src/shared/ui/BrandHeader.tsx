import type { ReactNode } from 'react';
import { t } from '@/shared/i18n';

/**
 * Bandeau rouge laque en haut des écrans principaux. `overlap` réserve de la place en bas
 * pour qu'une carte vienne chevaucher le bandeau (écran « Aujourd'hui »).
 */
export function BrandHeader({
  title,
  subtitle,
  aside,
  badge,
  overlap = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  /** Petite étiquette à côté du nom de l'appli (ex. « Données d'exemple »). */
  badge?: ReactNode;
  overlap?: boolean;
}) {
  return (
    <header
      className={`bg-laque text-on-laque pt-safe ${overlap ? 'pb-14' : 'pb-6'} lg:rounded-b-none`}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-3.5 px-5 pt-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-[-0.01em] lg:hidden">
              {t.app.name}
            </span>
            {badge && (
              <span className="border-on-laque-muted text-on-laque rounded-full border px-2 py-0.5 text-xs font-medium">
                {badge}
              </span>
            )}
          </span>
          {aside && <span className="text-on-laque-muted ml-auto text-sm">{aside}</span>}
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
          {subtitle && <p className="text-on-laque-muted m-0 text-[15px]">{subtitle}</p>}
        </div>
      </div>
    </header>
  );
}

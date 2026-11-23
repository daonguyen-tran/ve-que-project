import { Plus } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useActiveTrip } from '@/app/providers/active-trip-context';
import { t } from '@/shared/i18n';

/** Écrans de saisie où le bouton gênerait (il recouvrirait leur bouton principal). */
const HIDDEN_ON = ['/depenses/nouvelle', '/voyages/nouveau'];

/**
 * Bouton flottant « + Dépense », présent sur tous les écrans (F-5.1) : saisir une dépense
 * doit toujours être à un geste. Placé au-dessus de la barre d'onglets, côté pouce droit.
 * Masqué tant qu'aucun voyage n'existe (une dépense appartient toujours à un voyage) et sur
 * les écrans de saisie.
 */
export function QuickExpenseButton() {
  const { pathname } = useLocation();
  const { activeTrip } = useActiveTrip();
  if (!activeTrip || HIDDEN_ON.includes(pathname)) return null;

  return (
    <Link
      to="/depenses/nouvelle"
      aria-label={t.quickExpense.buttonLabel}
      className="bg-laque text-on-laque hover:bg-laque-deep fixed right-4 bottom-[calc(84px+env(safe-area-inset-bottom))] z-30 flex h-13 items-center gap-2 rounded-full pr-5 pl-4 text-base font-semibold no-underline shadow-[var(--shadow-fab)] transition-[transform,background-color] duration-150 ease-[var(--ease-out-expo)] active:scale-[0.96] lg:right-8 lg:bottom-8"
    >
      <Plus className="size-5" strokeWidth={2.2} aria-hidden="true" />
      {t.quickExpense.button}
    </Link>
  );
}

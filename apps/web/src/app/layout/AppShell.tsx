import { Outlet } from 'react-router';
import { PlanningEditModeProvider } from '@/features/planning/edit-mode';
import { UpdatePrompt } from '@/infrastructure/pwa/UpdatePrompt';
import { BottomNav } from './BottomNav';
import { QuickExpenseButton } from './QuickExpenseButton';
import { SideRail } from './SideRail';

/**
 * Ossature commune à tous les écrans.
 * - Mobile : contenu + barre d'onglets en bas + bouton « + Dépense ».
 * - PC (≥ 1024 px, `lg`) : rail latéral rouge à gauche, contenu à droite.
 * Le bas du contenu est réservé sur mobile pour que la barre et le bouton ne masquent rien.
 *
 * Le mode lecture / édition du planning est fourni ici, au-dessus des routes, pour rester actif
 * quand on passe d'un écran du planning à l'autre.
 */
export function AppShell() {
  return (
    <div className="bg-ground min-h-dvh lg:flex">
      <SideRail />
      <main className="min-w-0 flex-1 pb-[calc(148px+env(safe-area-inset-bottom))] lg:pb-24">
        <PlanningEditModeProvider>
          <Outlet />
        </PlanningEditModeProvider>
      </main>
      <QuickExpenseButton />
      <BottomNav />
      <UpdatePrompt />
    </div>
  );
}

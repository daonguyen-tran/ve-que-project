import { useRegisterSW } from 'virtual:pwa-register/react';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';

/**
 * Bandeau de mise à jour de la PWA.
 *
 * Quand une nouvelle version est déployée, le service worker la télécharge en arrière-plan
 * puis attend. On ne recharge jamais sans accord (une saisie pourrait être en cours) :
 * l'utilisateur touche « Mettre à jour » au moment qui lui convient.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="border-line bg-surface fixed inset-x-3 bottom-[calc(148px+env(safe-area-inset-bottom))] z-40 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--radius-card)] border p-3 pl-4 shadow-[var(--shadow-raised)] lg:inset-x-auto lg:right-8 lg:bottom-28 lg:max-w-sm"
    >
      <span className="flex-1 text-[15px]">{t.pwa.updateAvailable}</span>
      <div className="flex gap-1">
        <Button variant="quiet" onClick={() => setNeedRefresh(false)}>
          {t.pwa.dismiss}
        </Button>
        <Button onClick={() => void updateServiceWorker(true)}>{t.pwa.reload}</Button>
      </div>
    </div>
  );
}

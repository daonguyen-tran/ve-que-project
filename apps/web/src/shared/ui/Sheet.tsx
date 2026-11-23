import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { t } from '@/shared/i18n';

/**
 * Panneau modal : il monte du bas de l'écran sur mobile (à portée de pouce) et s'affiche au
 * centre sur PC.
 *
 * Construit sur l'élément HTML natif `<dialog>` ouvert avec `showModal()`. Le navigateur
 * fournit alors gratuitement ce qu'une bibliothèque devrait réimplémenter : le reste de la
 * page devient inerte (ni clic ni tabulation), le focus est gardé dans le panneau, la touche
 * Échap le ferme, et il s'affiche au-dessus de tout (« top layer »), sans `z-index`.
 *
 * Le composant est **contrôlé** : c'est le parent qui décide s'il est ouvert (`open`) et qui
 * réagit à la fermeture (`onClose`), qu'elle vienne d'Échap, du bouton ou d'un clic à côté.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Actions principales, toujours visibles en bas du panneau. */
  footer?: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="sheet"
      onClose={onClose}
      // Le panneau intérieur remplit tout le <dialog> : un clic dont la cible est le <dialog>
      // lui-même tombe forcément sur le fond assombri, à côté du panneau.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[min(90dvh,720px)] flex-col">
        <header className="border-line-soft flex items-center justify-between gap-3 border-b py-2 pr-2 pl-5">
          <h2 id={titleId} className="m-0 text-lg font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="text-muted hover:bg-ground flex size-11 items-center justify-center rounded-xl transition-colors"
          >
            <X className="size-5" strokeWidth={1.9} aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {children}
        </div>
        {footer && (
          <footer className="border-line-soft pb-safe flex flex-wrap justify-end gap-2 border-t px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}

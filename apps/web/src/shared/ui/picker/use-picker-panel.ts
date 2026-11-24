import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

/**
 * Comportement commun des champs qui déplient un sélecteur sous eux (date, heure).
 *
 * - Le panneau se referme quand on touche ailleurs : ouvrir un autre champ referme donc le
 *   premier, et deux panneaux ne se superposent jamais dans une même grille.
 * - Échap referme le panneau et rend le focus au champ. On arrête l'événement : sinon, le
 *   panneau (`<dialog>`) qui contient le formulaire se fermerait aussi.
 * - `close(true)` après un choix rend le focus au champ, pour enchaîner au clavier.
 *
 * L'écoute de `pointerdown` sur le document n'existe que pendant que le panneau est ouvert.
 */
export function usePickerPanel() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const close = (refocus = false) => {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !open) return;
    event.preventDefault();
    event.stopPropagation();
    close(true);
  };

  return {
    open,
    toggle: () => setOpen((current) => !current),
    close,
    triggerRef,
    panelRef,
    onKeyDown,
  };
}

import { Check, Pencil } from 'lucide-react';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { usePlanningEditMode } from './edit-mode-context';

/**
 * Bascule lecture / édition du planning.
 *
 * - En lecture : bouton secondaire « Modifier », discret.
 * - En édition : bouton plein « Terminé ». Le changement d'apparence du bouton lui-même dit
 *   dans quel mode on se trouve, sans bandeau supplémentaire.
 *
 * Le libellé visible change ; on n'utilise donc pas `aria-pressed` (un bouton bascule garde
 * normalement le même libellé). Une zone `aria-live` annonce le changement de mode aux
 * lecteurs d'écran, puisque le contenu de la page change en même temps.
 */
export function EditModeToggle() {
  const { editing, setEditing } = usePlanningEditMode();
  return (
    <>
      <Button
        variant={editing ? 'primary' : 'secondary'}
        onClick={() => setEditing(!editing)}
        className="shrink-0 px-3.5"
      >
        {editing ? (
          <Check className="size-[18px]" strokeWidth={2.2} aria-hidden="true" />
        ) : (
          <Pencil className="size-[18px]" strokeWidth={1.9} aria-hidden="true" />
        )}
        {editing ? t.plan.edit.done : t.plan.edit.start}
      </Button>
      <span className="sr-only" aria-live="polite">
        {editing ? t.plan.edit.announceOn : t.plan.edit.announceOff}
      </span>
    </>
  );
}

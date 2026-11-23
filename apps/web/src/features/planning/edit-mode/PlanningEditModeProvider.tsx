import { useMemo, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { isPlanningPath, PlanningEditModeContext } from './edit-mode-context';

/**
 * Fournit le mode lecture / édition du planning.
 *
 * Le mode vit en mémoire, au-dessus des routes, et non dans l'URL : il doit survivre aux
 * allers-retours entre les écrans du planning (ouvrir un jour, la fiche d'une étape, revenir),
 * qui ont chacun leurs propres liens. Il revient en lecture :
 * - dès qu'on quitte le planning (onglet Dépenses, Idées…) ;
 * - à chaque ouverture de l'application, puisque rien n'est mémorisé.
 *
 * La remise en lecture se fait pendant le rendu, en comparant avec le chemin précédent, plutôt
 * que dans un `useEffect` : React recalcule aussitôt, sans afficher un rendu intermédiaire
 * où le mode serait encore « édition » (motif « ajuster l'état quand une prop change »).
 */
export function PlanningEditModeProvider({
  children,
  initialEditing = false,
}: {
  children: ReactNode;
  /** Pour les tests : démarrer directement en édition. */
  initialEditing?: boolean;
}) {
  const { pathname } = useLocation();
  const inPlanning = isPlanningPath(pathname);
  const [editing, setEditing] = useState(initialEditing);
  const [wasInPlanning, setWasInPlanning] = useState(inPlanning);

  if (wasInPlanning !== inPlanning) {
    setWasInPlanning(inPlanning);
    if (!inPlanning) setEditing(false);
  }

  const value = useMemo(() => ({ editing, setEditing }), [editing]);
  return (
    <PlanningEditModeContext.Provider value={value}>{children}</PlanningEditModeContext.Provider>
  );
}

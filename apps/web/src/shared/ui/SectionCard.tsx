import { Plus, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';

/*
 * Grammaire des écrans de détail (fiche d'une étape, programme d'un jour) :
 *
 *   Rubrique   → `Section` : icône + titre en 18 px gras, posés sur le fond, avec un repère
 *                à droite (« 5 jours ») ; plus d'espace au-dessus qu'en dessous.
 *   Contenu    → `Card` : surface blanche à filets internes. Jamais de carte dans une carte :
 *                les éléments d'une carte sont des lignes, séparées par des filets ou des fonds.
 *   Action     → `AddRow` : pied de carte en laque, toujours « + verbe ». Le rouge laque est la
 *                couleur des actions (DESIGN.md) ; le contenu reste en encre.
 *
 * Trois niveaux qui se distinguent par la taille, la graisse, la couleur et la position, pas
 * seulement par le gras : c'est ce qui rend la fiche lisible d'un coup d'œil.
 */

export function Section({
  id,
  icon: Icon,
  title,
  aside,
  children,
  className,
}: {
  id: string;
  icon: LucideIcon;
  title: string;
  /** Repère court à droite du titre : un compte, une durée. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section aria-labelledby={id} className={cn('flex min-w-0 flex-col gap-3', className)}>
      <div className="flex min-h-7 items-center gap-2.5 px-1">
        <Icon className="text-ink-soft size-5 shrink-0" strokeWidth={1.9} aria-hidden="true" />
        <h2 id={id} className="m-0 flex-1 text-lg leading-tight font-bold tracking-[-0.01em]">
          {title}
        </h2>
        {aside && <span className="text-muted tabular shrink-0 text-[13px]">{aside}</span>}
      </div>
      {children}
    </section>
  );
}

/** Surface blanche d'une rubrique ; ses enfants directs sont séparés par un filet. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'border-line bg-surface divide-line-soft flex flex-col divide-y overflow-hidden rounded-[var(--radius-card)] border',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Action d'ajout en pied de carte : pleine largeur (cible confortable), texte laque. */
export function AddRow({
  label,
  ariaLabel,
  onClick,
}: {
  label: string;
  /** Libellé complet pour les lecteurs d'écran quand `label` est court (« Ajouter »). */
  ariaLabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="text-laque hover:bg-laque-tint active:bg-laque-tint focus-visible:outline-laque flex min-h-12 w-full items-center gap-2 px-4 text-left text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <Plus className="size-[18px] shrink-0" strokeWidth={2.2} aria-hidden="true" />
      {label}
    </button>
  );
}

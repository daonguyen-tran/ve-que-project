import type { ComponentProps } from 'react';
import { Link } from 'react-router';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'quiet';

/*
 * Retour tactile : légère compression au toucher (`active:scale`), sans délai, avec une
 * courbe ease-out. Le survol n'existe qu'avec une souris : Tailwind v4 restreint déjà
 * `hover:` aux appareils qui savent survoler, ce qui évite l'état « bloqué » après un tap.
 */
const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold no-underline transition-[transform,background-color] duration-150 ease-[var(--ease-out-expo)] active:scale-[0.97] disabled:opacity-50';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-laque text-on-laque hover:bg-laque-deep',
  quiet: 'text-laque hover:bg-laque-tint',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<'button'> & { variant?: Variant }) {
  return <button type="button" className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}

/** Lien de navigation interne présenté comme un bouton. */
export function ButtonLink({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={cn(BASE, VARIANTS[variant], className)} {...props} />;
}

/** Assemble des classes CSS en ignorant les valeurs vides : `cn('a', cond && 'b')`. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

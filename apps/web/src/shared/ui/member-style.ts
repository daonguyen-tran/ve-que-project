import type { MemberColor } from '@ve-que/domain';

/**
 * Pastille de couleur de chaque membre (fond teinté + texte foncé de la même famille).
 * Classes écrites en entier pour que Tailwind les génère.
 */
const MEMBER_CLASSES: Record<MemberColor, string> = {
  laque: 'bg-member-laque-tint text-member-laque',
  jade: 'bg-member-jade-tint text-member-jade',
  indigo: 'bg-member-indigo-tint text-member-indigo',
  ocre: 'bg-member-ocre-tint text-member-ocre',
  prune: 'bg-member-prune-tint text-member-prune',
  sarcelle: 'bg-member-sarcelle-tint text-member-sarcelle',
};

export function memberAvatarClass(color: string): string {
  return MEMBER_CLASSES[color as MemberColor] ?? MEMBER_CLASSES.laque;
}

/** Initiale affichée dans la pastille (gère les lettres accentuées : « Đ », « É »). */
export function memberInitial(name: string): string {
  return Array.from(name.trim())[0]?.toLocaleUpperCase('fr-FR') ?? '?';
}

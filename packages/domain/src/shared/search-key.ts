/**
 * Clé de recherche d'un texte : sans accents, sans casse, espaces réduits.
 * « Hội An », « Hoi An » et « hoi  an » donnent la même clé.
 *
 * Fonctionnement : la forme NFD sépare chaque lettre de ses accents (« ộ » devient « o » suivi
 * de deux diacritiques combinants), qu'on supprime ensuite. Le `đ` vietnamien n'est pas une
 * lettre accentuée pour Unicode (pas de décomposition NFD) : on le remplace à part.
 */
export function searchKey(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[-'’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

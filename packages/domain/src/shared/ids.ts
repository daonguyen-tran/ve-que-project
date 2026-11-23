import { v7 as uuidv7 } from 'uuid';

/**
 * Identifiant d'entité.
 *
 * Pourquoi un UUID **v7** généré côté client ?
 * - L'appli est offline-first : on doit pouvoir créer une dépense dans un village sans réseau,
 *   donc l'identifiant ne peut pas venir d'un serveur (pas d'auto-incrément).
 * - Un UUID v4 est purement aléatoire ; le v7 commence par un horodatage en millisecondes.
 *   Les identifiants sont donc triables par date de création, et les index (IndexedDB
 *   aujourd'hui, PostgreSQL demain) restent compacts car les insertions arrivent « dans l'ordre ».
 */
export type EntityId = string;

export function newId(): EntityId {
  return uuidv7();
}

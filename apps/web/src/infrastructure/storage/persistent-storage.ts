export type PersistenceStatus = 'persisted' | 'best-effort' | 'unsupported';

/**
 * Demande au navigateur de ne pas effacer nos données (F-15.3).
 *
 * Par défaut, le stockage d'un site est « best-effort » : si le téléphone manque de place,
 * Android peut vider IndexedDB, et donc toutes les dépenses du voyage. Une fois le stockage
 * « persistant » accordé, seul l'utilisateur peut l'effacer. Chrome l'accorde sans afficher de
 * question, en particulier pour une PWA installée sur l'écran d'accueil.
 */
export async function requestPersistentStorage(): Promise<PersistenceStatus> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) return 'unsupported';
  if (await navigator.storage.persisted()) return 'persisted';
  return (await navigator.storage.persist()) ? 'persisted' : 'best-effort';
}

import { createContext, useContext } from 'react';
import type { Repositories } from '@/infrastructure/repositories';

/**
 * Injection de dépendances par contexte React : les écrans demandent les repositories via
 * `useRepositories()` au lieu d'importer la base directement. Les tests peuvent ainsi fournir
 * une base en mémoire, et la v2 des implémentations synchronisées, sans toucher aux écrans.
 */
export const RepositoriesContext = createContext<Repositories | null>(null);

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) {
    throw new Error('useRepositories doit être utilisé sous <RepositoriesProvider>.');
  }
  return repositories;
}

import type { ReactNode } from 'react';
import type { Repositories } from '@/infrastructure/repositories';
import { RepositoriesContext } from './repositories-context';

export function RepositoriesProvider({
  repositories,
  children,
}: {
  repositories: Repositories;
  children: ReactNode;
}) {
  return <RepositoriesContext value={repositories}>{children}</RepositoriesContext>;
}

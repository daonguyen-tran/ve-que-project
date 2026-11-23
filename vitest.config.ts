import { defineConfig } from 'vitest/config';

// Un seul point d'entrée pour lancer les tests de tous les paquets (`pnpm test`).
export default defineConfig({
  test: {
    projects: ['packages/*', 'apps/*'],
  },
});

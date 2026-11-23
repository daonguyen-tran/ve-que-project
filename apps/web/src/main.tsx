// Polices auto-hébergées (et non chargées depuis Google Fonts) : elles sont mises en cache
// avec l'appli et restent disponibles hors ligne. Chaque fichier inclut le sous-ensemble
// « vietnamese » (diacritiques empilés : ệ, ộ, ữ…).
import '@fontsource/be-vietnam-pro/400.css';
import '@fontsource/be-vietnam-pro/500.css';
import '@fontsource/be-vietnam-pro/600.css';
import '@fontsource/be-vietnam-pro/700.css';
import './styles/index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { ActiveTripProvider } from './app/providers/ActiveTripProvider';
import { RepositoriesProvider } from './app/providers/RepositoriesProvider';
import { router } from './app/router';
import { VeQueDatabase } from './infrastructure/db/database';
import { createRepositories } from './infrastructure/repositories';
import { requestPersistentStorage } from './infrastructure/storage/persistent-storage';

// Composition root : on crée ici, une seule fois, la base et les repositories.
const repositories = createRepositories(new VeQueDatabase());

void requestPersistentStorage();

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Élément #root introuvable dans index.html');

createRoot(rootElement).render(
  <StrictMode>
    <RepositoriesProvider repositories={repositories}>
      <ActiveTripProvider>
        <RouterProvider router={router} />
      </ActiveTripProvider>
    </RepositoriesProvider>
  </StrictMode>,
);

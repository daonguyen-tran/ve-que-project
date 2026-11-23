import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // « prompt » plutôt que « autoUpdate » : une mise à jour ne recharge jamais la page
      // d'elle-même, ce qui ferait perdre une dépense en cours de saisie. L'utilisateur choisit
      // le moment via le bandeau `UpdatePrompt`.
      registerType: 'prompt',
      // Icônes PNG générées depuis public/icon.svg (voir pwa-assets.config.ts).
      pwaAssets: { config: true, overrideManifestIcons: true },
      manifest: {
        name: 'Về Quê',
        short_name: 'Về Quê',
        description: 'Préparer et vivre un voyage au Vietnam : itinéraire, idées, dépenses.',
        lang: 'fr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#A8322D',
        background_color: '#F5F5F4',
      },
      workbox: {
        // Le « shell » de l'appli (HTML, JS, CSS, polices, icônes) est mis en cache à
        // l'installation : l'appli s'ouvre sans réseau. Les données, elles, sont dans IndexedDB.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
});

import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Génère favicon, icônes Android (192, 512, maskable) et icône Apple à partir d'un seul SVG.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#A8322D' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#A8322D' } },
  },
  images: ['public/icon.svg'],
});

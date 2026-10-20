// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import { fiveLetterEnglishWordsPlugin } from './vite/fiveLetterEnglishWords.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.backloggames.com',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss(), fiveLetterEnglishWordsPlugin()],
  },
});

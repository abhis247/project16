import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter()
  },

  onwarn: (warning, handler) => {
    if (warning.code === 'css-unused-selector') return;
    handler(warning);
  }
};

export default config;
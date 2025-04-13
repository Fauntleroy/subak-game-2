import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs'
  },
  plugins: [
    svelte({
      compilerOptions: {
        hydratable: false
      }
    })
  ]
});

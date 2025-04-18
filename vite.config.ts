import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
    lib: {
      entry: 'src/lib/index.ts',
      name: 'subak-game-2'
    },
    rollupOptions: {
      external: ['svelte', 'svelte/internal'],
      output: {
        globals: {
          svelte: 'Svelte'
        }
      }
    }
  },
  plugins: [
    svelte({
      compilerOptions: {
        hydratable: false
      }
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'public/*',
          dest: 'assets'
        }
      ]
    })
  ]
});

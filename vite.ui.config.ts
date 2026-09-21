import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/** UI pages build (workspace / popup / options) — ESM output into dist/. */
export default defineConfig({
  root: path.join(root, 'src/ui'),
  plugins: [react()],
  build: {
    outDir: path.join(root, 'dist'),
    emptyOutDir: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        workspace: path.join(root, 'src/ui/workspace.html'),
        popup: path.join(root, 'src/ui/popup.html'),
        options: path.join(root, 'src/ui/options.html'),
      },
    },
  },
});

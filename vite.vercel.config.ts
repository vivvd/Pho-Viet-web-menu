import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

// A static bundle of the same menu, without the Cloudflare server runtime.
export default defineConfig({
  root: fileURLToPath(new URL('./deployment', import.meta.url)),
  publicDir: fileURLToPath(new URL('./public', import.meta.url)),
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
  build: {
    outDir: fileURLToPath(new URL('./dist-vercel', import.meta.url)),
    emptyOutDir: true,
  },
});

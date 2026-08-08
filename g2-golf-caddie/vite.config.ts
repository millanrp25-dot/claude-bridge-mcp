import { defineConfig } from 'vite';

export default defineConfig({
  // Even App loads the built page in a WebView; relative asset paths keep the
  // bundle working regardless of where the hub serves it from.
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
  },
});

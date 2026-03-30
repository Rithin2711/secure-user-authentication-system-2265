import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Vite configuration for WBD Frontend.
 * Uses @vitejs/plugin-react for React fast refresh
 * and @tailwindcss/vite for Tailwind CSS v4 integration.
 */
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/mock': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
});

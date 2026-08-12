import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
// `vitest/config` e não `vite`: é ele que estende a config do Vite com a chave
// `test`. Importando de `vite`, o TypeScript recusa a chave como desconhecida.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    port: 5173,
    // Em produção quem garante a origem única é o proxy NGINX. Em
    // desenvolvimento o NGINX não participa, e é este proxy que produz o mesmo
    // efeito: o front chama `/api/...` relativo, sem CORS e sem saber a URL da
    // API. Enquanto o backend não existir, estas chamadas falham — o lugar da
    // configuração é aqui de qualquer forma.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

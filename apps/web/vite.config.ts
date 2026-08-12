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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      // Os primitivos vieram copiados da CLI e não são testados aqui; as
      // cascas de página saem conforme cada tela real chega.
      exclude: ['src/components/ui/**', 'src/main.tsx'],
      // Sem limite, de propósito: o único do projeto é o de `packages/shared`,
      // onde ele significa alguma coisa. O relatório existe para ser lido, e
      // para o `outputs` do turbo.json descrever a tarefa com honestidade.
    },
  },
});

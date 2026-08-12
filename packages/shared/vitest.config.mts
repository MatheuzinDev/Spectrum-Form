// Extensão `.mts`, e não `.ts`: este pacote é `"type": "commonjs"`, então um
// `.ts` com `import` é carregado como CommonJS e o Vite avisa que isso deixa de
// funcionar quando o carregamento nativo de configuração virar padrão. O `.mts`
// é ESM independentemente do `type` do pacote.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // O barrel só reexporta: os testes importam o módulo direto, então ele
      // nunca é carregado e apareceria como 0% sem nada a cobrir.
      exclude: ['src/index.ts'],
      // O único limite de cobertura do projeto (seção 12). Para duas funções
      // puras, qualquer valor abaixo de 100% seria arbitrário — e a linha que
      // ficaria de fora é justamente o ramo dos dígitos repetidos.
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});

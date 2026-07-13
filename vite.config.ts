import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.spec.ts',          // Exclui arquivos de testes unitários
        'src/**/*.test.ts',          // Exclui arquivos de testes de integração
        'src/**/tests/**',           // Exclui pastas de mocks/repositories em memória
        'src/**/factories/**',       // Exclui as fábricas (factories) que criamos para os testes
        'src/**/infra/**',           // Opcional: Se quiser ignorar a camada de infra/banco pura do coverage
      ],
    }
  }
})
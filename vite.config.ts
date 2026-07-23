import 'reflect-metadata'
import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // 🚀 Garante que o Vitest compila os testes usando o SWC e respeitando o .swcrc
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
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
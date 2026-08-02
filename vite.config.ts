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
      sourceMaps: 'inline', // 👈 1. 'inline' garante que os sourcemaps sejam embutidos diretamente no bundle para a UI ler
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      clean: true, // 👈 2. Limpa relatórios obsoletos para não travar a UI com cache velho
      cleanOnRerun: true, // 👈 3. Recalcula a cobertura a cada alteração em tempo real na UI
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/tests/**',
        'src/**/factories/**',
        'src/**/infra/**',
      ],
    }
  }
})
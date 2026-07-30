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
      sourceMaps: true, // 👈 OBRIGATÓRIO para o coverage v8
    }),
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
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
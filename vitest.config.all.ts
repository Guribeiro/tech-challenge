import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig({
  plugins: viteConfig.plugins,
  resolve: viteConfig.resolve,
  test: {
    globals: true,
    environment: 'node',
    // Inclui de forma explícita tanto os unitários quanto os E2E
    include: ['src/**/*.{test,spec}.ts', 'src/**/*.e2e-spec.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/generated/**'
    ],
    fileParallelism: false,
    env: {
      DATABASE_URL:
        'postgresql://postgres:postgres@localhost:5433/oficina_test_db?schema=public',
    },
    coverage: {
      enabled: true, // 👈 Força a coleta ativa compatível com a UI
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      clean: true,
      cleanOnRerun: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        // Testes e Utilitários de Teste
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
        'src/**/*.e2e-spec.ts',
        'src/**/tests/**',
        'src/**/factories/**',

        // Boilerplate, Módulos e DTOs
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts',
        'src/generated/**',

        // Camada de Infraestrutura e Banco de Dados
        'src/**/infra/**',
        'src/infra/**',
        'src/**/prisma/**',
        '**/seed.ts',
      ],
    },
  },
})
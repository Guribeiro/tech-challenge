import { defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default defineConfig({
  // 1. Reutiliza os plugins (SWC) e resolve (tsconfigPaths) do vite.config base
  plugins: viteConfig.plugins,
  resolve: viteConfig.resolve,

  // 2. Define a chave test DO ZERO, sem concatenar arrays via mergeConfig
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.e2e-spec.ts'],
    exclude: ['src/**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
    fileParallelism: false,
    testTimeout: 30000, // 30 segundos para todos os testes E2E
    hookTimeout: 30000, // Timeout específico para hooks como beforeEach/afterAll
    env: {
      DATABASE_URL:
        'postgresql://postgres:postgres@localhost:5433/oficina_test_db?schema=public',
    },
  },
})
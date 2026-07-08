// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignorar pastas de builds e dependências
  { 
    ignores: ['node_modules/', 'dist/', 'build/', 'coverage/'] 
  },
  
  // Aplicar regras globais recomendadas
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Configurações customizadas do ambiente Node + TypeScript
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    },
  }
]);

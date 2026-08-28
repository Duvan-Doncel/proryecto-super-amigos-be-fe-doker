// Archivo: eslint.config.js
// Descripción: Configuración de ESLint para el backend (Node.js + TypeScript).
// ¿Para qué? La plantilla original no traía este archivo — sin él, `pnpm lint` fallaba
//   porque ESLint 9 exige un eslint.config.js explícito (ya no lee .eslintrc).
// ¿Impacto? Sin esto, RH-001 (lint obligatorio antes de cada commit) no se puede cumplir.

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'prisma/migrations']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: {
      // ¿Qué? RNF-003.2 pide tipos explícitos — `any` implícito queda prohibido,
      //   pero se permite declararlo explícitamente cuando está justificado.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);

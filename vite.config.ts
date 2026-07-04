import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

import { execSync } from 'child_process';
import packageJson from './package.json';

const commitHash = execSync('git rev-parse --short HEAD').toString().trim();
const appVersion = packageJson.version;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      legacy({
        targets: ['defaults', 'Safari >= 12', 'not IE 11'],
        modernPolyfills: true
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ""),
      '__APP_VERSION__': JSON.stringify(appVersion),
      '__COMMIT_HASH__': JSON.stringify(commitHash)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      target: 'es2015',
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true
    },
    test: {
      globals: true,
      environment: 'node', // Use 'jsdom' if testing components
      exclude: ['tests/**', 'node_modules/**'], // Ignore Playwright E2E tests
    }
  };
});

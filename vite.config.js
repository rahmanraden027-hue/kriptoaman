import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }),
    react(),
    {
      name: 'zvq-source-png-exclusion',
      apply: 'build',
      async closeBundle() {
        // Preserve approved PNG masters in public/ and Git; ship optimized WebP only.
        const symbols = ['ZVQ', 'ZEVARYQ_NETWORK', 'zBTC', 'zETH', 'zUSDT', 'zUSDC', 'zBNB', 'zSOL', 'zTRX', 'zXRP', 'zADA', 'zDOGE'];
        for (const symbol of symbols) {
          await rm(resolve('dist', 'assets', 'zevaryq', 'tokens', `${symbol}.png`), { force: true });
        }
      },
    },
  ],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 750,
  },
});

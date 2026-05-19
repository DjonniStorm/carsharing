import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // dist — CJS; Vite нужны ESM named exports → резолвим исходники
      '@carsharing/validation': path.resolve(
        repoRoot,
        'packages/validation/src/index.ts',
      ),
    },
  },
})

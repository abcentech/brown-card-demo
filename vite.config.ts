import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Node globals are not in tsconfig types (no @types/node); declare the one we read.
declare const process: { env: Record<string, string | undefined> }

// base './' keeps asset paths relative so the build works from any folder or host.
export default defineConfig({
  base: './',
  // Honour PORT when a launcher assigns one; Vite's default 5173 otherwise.
  server: { port: Number(process.env.PORT) || 5173 },
  preview: { port: Number(process.env.PORT) || 4173 },
  plugins: [react(), tailwindcss()],
  test: { include: ['tests/**/*.test.ts'], exclude: ['tests/e2e/**', 'node_modules/**'] },
})

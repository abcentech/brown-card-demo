import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' keeps asset paths relative so the build works from any folder or host.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: { include: ['tests/**/*.test.ts'], exclude: ['tests/e2e/**', 'node_modules/**'] },
})

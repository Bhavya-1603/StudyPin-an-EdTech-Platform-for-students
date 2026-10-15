import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: resolve(__dirname, 'frontend'),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'frontend/dist'),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})

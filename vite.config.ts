import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sourceLoc from './tools/vite-plugin-source-loc.mjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [sourceLoc(), react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') }
  }
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES === 'true' ? (process.env.VITE_PUBLIC_BASE || '/') : '/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
}) 
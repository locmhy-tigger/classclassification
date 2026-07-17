import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API requests to the Flask backend (server.py) running on port 5000.
    // Without this proxy, fetch('/api/...') calls from the dev server never reach
    // Flask, so the "選擇工作目錄" / "更改路徑" buttons silently fail.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
})

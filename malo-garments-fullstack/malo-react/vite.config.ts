import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001', // IPv4 on purpose: WSL's [::1] relay can swallow 'localhost' requests
        changeOrigin: true,
      }
    }
  }
})

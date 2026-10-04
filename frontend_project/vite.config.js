import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://backend:8000', 
        changeOrigin: false,
      },
      '/admin': {
        target: 'http://backend:8000',
        changeOrigin: false,
      },
      '/media': {
        target: 'http://backend:8000',
        changeOrigin: false,
      },
      '/static': {
        target: 'http://backend:8000',
        changeOrigin: false,
      }
    }
  }
})

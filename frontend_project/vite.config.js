import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true, // ХОТ-ФИКС: заставляет Vite вручную проверять файлы в Docker
      interval: 100,    // опрашивать каждые 100 мс
    },
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

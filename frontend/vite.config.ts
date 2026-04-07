import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/documents': 'http://localhost:8080',
      '/query': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    },
  },
})

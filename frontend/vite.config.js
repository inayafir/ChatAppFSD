import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client expects a CommonJS-style `global`
  define: {
    global: 'window',
  },
  server: {
    port: 5173,
  },
})

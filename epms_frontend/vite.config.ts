import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwincss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    tailwincss(),
  ],
  define: {
    // Fix for sockjs-client "global is not defined" error
    global: 'globalThis',
  },
})
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
  // server: {
  //   // This allows ngrok to bypass the "Blocked Request" security check
  //   allowedHosts: [
  //     'dash-murmuring-symphony.ngrok-free.dev', // The specific host from your error
  //     '.ngrok-free.dev',                        // This allows any ngrok subdomain
  //     '.ngrok-free.app'                         // Also covers the .app extension
  //   ]
  // }
})
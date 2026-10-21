import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Long-lived vendor chunks (cached across deploys)
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/[\\/](motion|framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) return 'motion'
            if (/[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) return 'react'
            if (/[\\/](radix-ui|@radix-ui)[\\/]/.test(id)) return 'radix'
            if (/[\\/](react-icons|lucide-react)[\\/]/.test(id)) return 'icons'
          },
        },
      },
    },
    server: {
      // Proxy backend + Keycloak so the browser only talks to the Vite origin (no CORS setup needed in dev)
      proxy: {
        '/api': { target: env.API_PROXY_TARGET || 'http://localhost:1444', changeOrigin: true },
        '/realms': {
          target: env.KEYCLOAK_PROXY_TARGET || 'http://localhost:1401',
          changeOrigin: true,
          // Strip Origin so Keycloak treats it like Postman (no "Web origins" config needed on the client)
          configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
        },
      },
    },
  }
})

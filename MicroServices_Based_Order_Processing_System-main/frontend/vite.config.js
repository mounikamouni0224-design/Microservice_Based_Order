import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api/customers': {
          target: env.VITE_CUSTOMER_SERVICE_URL || 'http://localhost:8081',
          changeOrigin: true,
        },
        '/api/products': {
          target: env.VITE_PRODUCT_SERVICE_URL || 'http://localhost:8082',
          changeOrigin: true,
        },
        '/api/orders': {
          target: env.VITE_ORDER_SERVICE_URL || 'http://localhost:8083',
          changeOrigin: true,
        },
        '/api/notifications': {
          target: env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:8084',
          changeOrigin: true,
        },
      },
    },
  }
})

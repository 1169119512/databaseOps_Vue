import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import configManagerPlugin from './vite-plugin-config-manager.js'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [vue(), configManagerPlugin()],
    server: {
      port: 80,
      host: '0.0.0.0',
      allowedHosts: [
        'frp-fun.com',
        '.frp-fun.com'  // 允许所有子域名
      ],
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  }
})


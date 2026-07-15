import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  server: {
    proxy: {
      '/calendar': {
        target: 'https://www.zmkhai.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

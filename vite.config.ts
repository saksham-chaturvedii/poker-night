import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // The production build is served from https://<user>.github.io/poker-night/,
  // so every asset URL needs that prefix — but keep local `npm run dev` at
  // the site root so it still opens at plain http://localhost:<port>/.
  base: command === 'build' ? '/poker-night/' : '/',
  plugins: [react()],
}))

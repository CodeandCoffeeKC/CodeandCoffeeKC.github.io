import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Organization GitHub Pages site - uses root path
  // Repo name: CodeandCoffeeKC.github.io
  // URL: https://codeandcoffeekc.github.io/
  base: '/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})

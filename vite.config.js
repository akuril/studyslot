import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // The site lives at https://YOUR-USERNAME.github.io/homeworkhq/
  // This must match the GitHub repository name exactly (including lowercase).
  base: '/homeworkhq/',
  plugins: [react()],
})
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// No `base` setting: StudySlot is served from the root of its domain ("/"),
// both locally and on Netlify.
export default defineConfig({
  plugins: [react()],
})

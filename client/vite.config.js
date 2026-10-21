import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
// No `base` setting: StudySlot is served from the root of its domain ("/"),
// both locally and on Netlify.
export default defineConfig({
  plugins: [react()],
  server: {
    // Development only: the browser calls http://localhost:5173/api/...
    // (same origin as the page) and Vite forwards it to the Express API.
    // Same-origin requests are not blocked by browser privacy/ad-block
    // features and need no CORS. Production (Netlify) does not use this:
    // there VITE_API_BASE_URL is the full Render URL.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});

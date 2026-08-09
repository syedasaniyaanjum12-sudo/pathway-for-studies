import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow importing datasets/seed.sql from outside client/ — it's shared
    // with the future Data Analytics track (Phase 3), so it lives at the
    // repo root instead of being duplicated inside client/src.
    fs: { allow: ['..'] },
  },
})

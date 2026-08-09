import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow importing datasets/*.csv and seed.sql from outside client/ —
    // shared with the Data Analytics track, so it lives at the repo root
    // instead of being duplicated inside client/src.
    fs: { allow: ['..'] },
  },
  optimizeDeps: {
    // Pyodide's package has Node-only code paths behind runtime checks
    // (used only when running under Node, never in a browser). Vite's dev
    // pre-bundler doesn't know that and fails trying to statically analyze
    // them, so it's excluded from pre-bundling — a documented Pyodide+Vite
    // requirement, not a workaround specific to this app.
    exclude: ['pyodide'],
  },
})

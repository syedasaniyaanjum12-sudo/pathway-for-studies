/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute base URL of the API server, e.g. 'https://pathway-api.onrender.com'.
   * Unset in dev (client/src/lib/api.ts falls back to '', so requests stay
   * relative and go through Vite's dev proxy — see vite.config.ts). Set at
   * build time for a split production deployment where the client and
   * server are on different origins — see docs/DEPLOY.md. */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

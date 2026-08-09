# shared

- `types.ts` — TypeScript types used by both `client` and `server` (`SqlQuestion`, `DataAnalyticsExercise`, `AiProject`, `Difficulty`, etc.).
- `data/*.ts` — the actual question/exercise/project content. This is the human-edited source of truth; `server/prisma/seed.ts` reads it to populate the database. The client no longer imports these directly — it fetches from the API instead (see `client/src/lib/api.ts`).

To add or edit content: edit a file here, then `cd server && npm run prisma:seed`.

Note: relative imports within this folder use explicit `.js` extensions (e.g. `from '../types.js'`), even though the files are `.ts`. That's required by the server's `NodeNext` module resolution — the client's bundler-based resolution doesn't care either way, so this convention just needs to hold inside `shared/` itself.

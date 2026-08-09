# server

Express + TypeScript API, backed by SQLite via Prisma in dev (swap to Postgres for prod — see `prisma/schema.prisma`).

Serves read-only content for all three tracks: `GET /api/sql-questions`, `GET /api/data-analytics-exercises`, `GET /api/ai-projects`. Grading still happens client-side (sql.js/Pyodide) — this API only serves question/exercise/project content.

## Setup

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run prisma:seed      # populates it from ../shared/data/*.ts
npm run dev              # starts the API on :4000
```

## Adding new content

Edit `../shared/data/sqlQuestions.ts` (or `aiProjects.ts` / `dataAnalyticsExercises.ts`), then re-run `npm run prisma:seed` — it's an upsert, so it's safe to re-run any time.

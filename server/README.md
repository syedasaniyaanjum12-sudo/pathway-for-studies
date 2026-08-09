# server

Express + TypeScript API, backed by SQLite via Prisma in dev (swap to Postgres for prod — see `prisma/schema.prisma`).

## Routes

Public, read-only content:
- `GET /api/sql-questions`, `GET /api/data-analytics-exercises`, `GET /api/ai-projects`

Auth:
- `POST /api/auth/register` / `POST /api/auth/login` — body `{ email, password }`, returns `{ token, user }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

Progress tracking (all require `Authorization: Bearer <token>`):
- `POST /api/sql-questions/:id/submissions` — body `{ submittedQuery, isCorrect }`
- `POST /api/data-analytics-exercises/:id/submissions` — body `{ submittedCode, isCorrect }`
- `PUT /api/ai-projects/:id/status` — body `{ status: 'not-started' | 'in-progress' | 'done' }`
- `GET /api/me/progress` — one summary of solved questions/exercises and project statuses

Grading itself still happens client-side (sql.js/Pyodide) — the submission endpoints just record a result the client already computed. See `docs/PLAN.md` for the trust-boundary trade-off that implies.

## Setup

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run prisma:seed      # populates it from ../shared/data/*.ts
npm run dev              # starts the API on :4000
```

`.env` needs `DATABASE_URL`, `PORT`, and `JWT_SECRET` — see `.env.example`.

## Adding new content

Edit `../shared/data/sqlQuestions.ts` (or `aiProjects.ts` / `dataAnalyticsExercises.ts`), then re-run `npm run prisma:seed` — it's an upsert, so it's safe to re-run any time.

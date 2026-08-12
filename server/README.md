# server

Express + TypeScript API, backed by SQLite via Prisma in dev (swap to Postgres for prod — see `prisma/schema.prisma`).

## Routes

Public, read-only content:
- `GET /api/sql-questions`, `GET /api/data-analytics-exercises`, `GET /api/ai-projects`

Auth:
- `POST /api/auth/register` / `POST /api/auth/login` — body `{ email, password }`, returns `{ token, user }`
- `GET /api/auth/me` — requires `Authorization: Bearer <token>`

Progress tracking (all require `Authorization: Bearer <token>`), responses are `{ id, isCorrect, gradedBy: 'client' | 'server', serverNote? }`:
- `POST /api/sql-questions/:id/submissions` — body `{ submittedQuery, isCorrect }`
- `POST /api/data-analytics-exercises/:id/submissions` — body `{ submittedCode, isCorrect }`
- `PUT /api/ai-projects/:id/status` — body `{ status: 'not-started' | 'in-progress' | 'done' }`
- `GET /api/me/progress` — one summary of solved questions/exercises and project statuses

For Easy/Medium/Hard, submission endpoints record whatever `isCorrect` the client (which already graded the attempt itself, in-browser) reports, unchecked (`gradedBy: 'client'`). For **Interview-tier** questions/exercises, the server independently re-runs the submission itself — `lib/sqlEngine.ts` (sql.js again, server-side) for SQL, `lib/pythonSandbox.ts` (spawns `python/run_sandboxed.py`, a RestrictedPython sandbox) for Data Analytics — and its own `isCorrect` is authoritative (`gradedBy: 'server'`), falling back to the client's self-report only if server-side grading itself can't run (`serverNote` explains why). See `docs/PLAN.md`'s "Trust boundary" section for the full reasoning and the Python sandbox's security posture.

## Setup

```bash
npm install
npx prisma migrate dev   # creates prisma/dev.db and applies the schema
npm run prisma:seed      # populates it from ../shared/data/*.ts
python -m pip install -r python/requirements.txt   # optional — enables Interview-tier Python re-grading
npm run dev              # starts the API on :4000
```

`.env` needs `DATABASE_URL`, `PORT`, and `JWT_SECRET` — see `.env.example`. `PYTHON_BIN` is optional (defaults to `python` on PATH) if your Python interpreter is named differently or not on PATH.

If the Python requirements aren't installed, Interview-tier Data Analytics submissions still work — they just fall back to trusting the client's own grading instead of failing (checked once per server process, not per-request; restart the server after installing to pick it up).

## Adding new content

Edit `../shared/data/sqlQuestions.ts` (or `aiProjects.ts` / `dataAnalyticsExercises.ts`), then re-run `npm run prisma:seed` — it's an upsert, so it's safe to re-run any time.

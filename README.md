# Pathway for Studies

A learning platform with three tracks:

- **SQL Practice** — Easy/Medium/Hard/Interview questions, run entirely in-browser (sql.js) against a seeded sample database (Employees, Departments, Customers, Orders, Products, Sales).
- **Data Analytics** — NumPy/Pandas/EDA/Matplotlib exercises, run entirely in-browser via Pyodide.
- **AI Engineer Projects** — a project catalog across Beginner/Intermediate/Advanced/Portfolio levels.

Content (questions/exercises/projects) is served by a small Express + Prisma API; grading itself still happens client-side (sql.js/Pyodide), so learner code never leaves the browser. Signing in (email/password) saves your progress — solved questions/exercises and project status — across sessions.

See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture, tech stack, folder structure, and phased build-out plan.

## Development

First time only:

```bash
npm run install:all   # installs client/ and server/ dependencies
cd server && npx prisma migrate dev && npm run prisma:seed && cd ..
```

Then, from the repo root:

```bash
npm run dev   # starts the API (:4000) and the client (:5173) together
```

Open http://localhost:5173. (You can also run `cd server && npm run dev` and `cd client && npm run dev` in two separate terminals if you prefer.)

## Status

**Phase 5 complete** — all three tracks are functional, backed by a real database, with accounts and progress tracking:
- SQL Practice: 24 questions, sql.js
- AI Engineer Projects: 20 projects across 4 levels
- Data Analytics: 19 exercises (NumPy/Pandas/Data Cleaning/Missing Values/EDA/Matplotlib), running in-browser via Pyodide
- Backend: Express + Prisma (SQLite for dev), serving all three content types over `/api/*`
- Auth: email/password with JWTs (`/api/auth/register`, `/login`, `/me`); signed-in users get solved-question checkmarks and can track AI project status (not-started/in-progress/done)

Next up (Phase 6): optional server-side grading modes for Interview-level questions, closer to a real interview environment.

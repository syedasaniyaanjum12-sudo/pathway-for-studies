# Pathway for Studies

A learning platform with three tracks:

- **SQL Practice** — Easy/Medium/Hard/Interview questions, run entirely in-browser (sql.js) against a seeded sample database (Employees, Departments, Customers, Orders, Products, Sales).
- **Data Analytics** — NumPy/Pandas/EDA/Matplotlib exercises, run entirely in-browser via Pyodide.
- **AI Engineer Projects** — a project catalog across Beginner/Intermediate/Advanced/Portfolio levels.

Content (questions/exercises/projects) is served by a small Express + Prisma API. Grading happens client-side (sql.js/Pyodide) for Easy/Medium/Hard; for Interview-tier questions, the server *also* independently re-runs and grades your submission (see "Server-side re-grading" below), so a right answer means the server checked it, not just your own browser. Signing in (email/password) saves your progress — solved questions/exercises and project status — across sessions.

Signed-in progress is framed as an RPG-style career path: solving questions/exercises and completing projects earns XP, which levels you up from **LEVEL 0 — Beginner** to **LEVEL 10 — Job-Ready AI Engineer**, shown on the Home page along with the topics/skills you've unlocked so far. The **World Map** (`/world-map`) groups that same content into 11 themed "Worlds" laid out as a career path, each unlocking at a level — click into one to jump straight to its questions/exercises/projects, pre-filtered. Each World also has a 4-question concept **Quiz**, and the 7 SQL/Data Analytics Worlds each have a timed **Mini Challenge** (an existing question against a countdown clock) and a **Boss Challenge** (a harder, multi-part capstone with its own "Boss HP" bar) — all three linked straight from their World Map card, which shows a "🏆 World Complete" badge once a World's boss is defeated. See `docs/PLAN.md`'s "Gamification plan" section for the full level curve, world list, and what's still deferred (badges/streaks, the full per-topic lesson loop).

See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture, tech stack, folder structure, and phased build-out plan, and [`docs/DEPLOY.md`](docs/DEPLOY.md) for deploying to Vercel + Render.

## Development

First time only:

```bash
npm run install:all   # installs client/ and server/ dependencies
cd server && npx prisma migrate dev && npm run prisma:seed && cd ..
python -m pip install -r server/python/requirements.txt   # optional — enables Interview-tier Python re-grading
```

Then, from the repo root:

```bash
npm run dev   # starts the API (:4000) and the client (:5173) together
```

Open http://localhost:5173. (You can also run `cd server && npm run dev` and `cd client && npm run dev` in two separate terminals if you prefer.)

## Server-side re-grading (Interview-tier)

For Interview-difficulty questions/exercises, the server independently re-runs your submission instead of just trusting your browser's own grading result:

- **SQL** — the server runs your query through sql.js again, server-side, in a fresh in-memory database.
- **Data Analytics** — the server runs your code through a `RestrictedPython`-sandboxed interpreter (blocks `import`, blocks the classic dunder-attribute sandbox-escape trick, times out after 10s). Needs `python -m pip install -r server/python/requirements.txt`; if that's not installed, these exercises quietly fall back to trusting your own client-side result instead of failing.

**Security note:** the Python sandbox is real protection against casual misuse, not container-grade isolation — see the comment at the top of `server/python/run_sandboxed.py` before considering this suitable for anything beyond a single-user local learning app.

## Status

**Phase 11 complete** — RPG career progression (XP/Levels 0-10, skills unlocked, a World Map grouping all content into a leveled career path, per-World Quizzes, timed Mini Challenges, and multi-part Boss Challenges) on top of the Phase 7 feature-complete, deploy-ready app:
- SQL Practice: 24 questions, sql.js, with search + difficulty filter
- AI Engineer Projects: 20 projects across 4 levels, with search + level filter
- Data Analytics: 19 exercises (NumPy/Pandas/Data Cleaning/Missing Values/EDA/Matplotlib), running in-browser via Pyodide, with search + difficulty filter
- Backend: Express + Prisma (SQLite for dev), serving all three content types over `/api/*`
- Auth: email/password with JWTs; signed-in users get solved-question checkmarks, AI project status tracking, and a progress summary on the Home page
- Server-side re-grading: Interview-tier submissions are independently re-checked server-side, not just self-reported by the browser (see above)
- Deploy-ready: `CORS_ORIGIN` / `VITE_API_BASE_URL` support a split production deployment (client + server on different origins) — see [`docs/DEPLOY.md`](docs/DEPLOY.md) for the actual Vercel + Render steps

Not yet deployed live — that needs your own hosting accounts, see `docs/DEPLOY.md`.

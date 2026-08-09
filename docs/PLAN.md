# Project Plan

This records the plan agreed on before implementation started, so decisions aren't lost across sessions.

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + TypeScript | Fast dev loop, type safety while learning. |
| Styling | Tailwind CSS | Utility classes, no context-switching to separate stylesheets. |
| Code editor | CodeMirror 6 | Lightweight, reusable across SQL and Python pages. |
| SQL engine | sql.js (SQLite via WebAssembly) | Runs real SQL entirely client-side — safe by default, no backend needed for grading. |
| Python engine | Pyodide (Python + NumPy/Pandas/Matplotlib via WebAssembly) | Same client-side-safe pattern as sql.js, for the Data Analytics track. |
| Backend | Node.js + Express + TypeScript | Same language as the frontend; added in Phase 4. |
| App database | PostgreSQL + Prisma ORM | Type-safe schema/queries; dev can start on SQLite via Prisma and swap datasource later. |
| Auth | JWT-based email/password | Simple, no third-party dependency to start. |
| Hosting | Frontend: Vercel/Netlify · Backend+DB: Render/Railway | Free tiers, minimal DevOps overhead. |

## Architecture

Two independent apps talking over a REST API, plus a shared types/data package:

```
Browser (React SPA)
   ├─ SQL Practice: fetches questions from the API, runs queries locally in sql.js, compares to expected result
   ├─ Data Analytics: fetches exercises from the API, runs Python via Pyodide, compares output/plot to expected result
   └─ AI Projects: fetches projects from the API, browses/filters cards
        │
        ▼  REST (fetch, proxied by Vite's dev server — see client/vite.config.ts)
Express API  ──────────────  SQLite dev / PostgreSQL prod (via Prisma)
   (questions, exercises, projects, users, submissions, progress)
```

Phases 1-3 ran without a backend at all (static JSON data), so the UI worked before databases entered the picture. Phase 4 moved that content into a real database and added the API in between — grading itself is unchanged (still sql.js/Pyodide in the browser), since the API only serves question/exercise/project content, not query execution. Phase 5 added JWT auth on top: the client holds a token (localStorage) and attaches it as `Authorization: Bearer <token>` to the handful of routes that need to know who's asking (recording a submission, setting a project status, reading `/api/me/progress`) — everything else stays public/read-only.

## Folder Structure

```
pathway-for-studies/
├── package.json                    # root convenience only: `npm run dev` starts client+server together
├── client/                         # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── SqlPractice/
│   │   │   ├── DataAnalytics/
│   │   │   └── AiProjects/
│   │   ├── components/            # Badge, CodeEditor, ResultTable, PythonResultView, ...
│   │   ├── lib/
│   │   │   ├── api.ts              # fetch wrappers for the Express API (Phase 4)
│   │   │   ├── sqlEngine.ts        # sql.js wrapper (Phase 1)
│   │   │   ├── grading.ts          # SQL result comparison
│   │   │   ├── pythonEngine.ts     # Pyodide wrapper (Phase 3)
│   │   │   └── pythonGrading.ts    # Python result comparison
│   │   └── App.tsx
│   └── package.json
├── server/                         # Express + Prisma backend (Phase 4)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts                 # populates the DB from shared/data/*.ts
│   ├── src/
│   │   ├── lib/{prisma,auth}.ts
│   │   ├── middleware/requireAuth.ts
│   │   ├── routes/                 # sql-questions, data-analytics-exercises, ai-projects, auth, me/progress
│   │   └── index.ts
│   └── package.json
├── shared/                         # types + content shared by client (types only) and server (types + seed data)
│   ├── types.ts
│   └── data/                       # sqlQuestions.ts, dataAnalyticsExercises.ts, aiProjects.ts — human-edited source of new content
├── datasets/                       # seed .sql / .csv files: Employees, Departments, Customers, Orders, Products, Sales
└── docs/
```

## Database Plan

**Practice datasets** (the subject of exercises) — plain seed files for Employees, Departments, Customers, Orders, Products, Sales, loaded client-side per exercise.

**App database** (SQLite for dev, Postgres for prod — same Prisma schema either way, just a different `datasource` provider + `DATABASE_URL`):

```
SqlQuestion               (id, title, difficulty, topic, prompt, solutionQuery, orderMatters, hint)
DataAnalyticsExercise     (id, title, difficulty, topic, prompt, datasets[Json], solutionCode, hint, expectsPlot)
AiProject                 (id, title, level, description, techStack[Json], skills[Json])

User                      (id, email, passwordHash, createdAt)
SqlSubmission             (id, userId, questionId, submittedQuery, isCorrect, submittedAt)
DataAnalyticsSubmission   (id, userId, exerciseId, submittedCode, isCorrect, submittedAt)
UserProjectStatus         (id, userId, projectId, status[not-started|in-progress|done], updatedAt)
```

Submissions are an append-only attempt log (one row per "Run", not just the latest) rather than a single mutable "solved" flag — "has this learner ever solved X" is computed at query time (`GET /api/me/progress`) by checking whether any `isCorrect: true` row exists for that (user, question) pair.

**Trust boundary, stated plainly:** grading still happens entirely client-side (sql.js/Pyodide). The submission endpoints record whatever `isCorrect` value the client reports — the server never re-executes the query/code itself. A learner could technically POST `isCorrect: true` without solving anything. For a learning tool with no certification value at stake, that's an acceptable trade-off (the same one made in Phase 4 when solution code was exposed to the client at all) — revisit if this ever needs to mean something to someone other than the learner.

## Development Phases

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold, tooling, routed empty pages | ✅ Done |
| 1 | SQL Practice MVP (≥20 questions, sql.js, seeded datasets) | ✅ Done |
| 2 | AI Projects MVP (static cards, 4 levels) | ✅ Done |
| 3 | Data Analytics MVP (Pyodide, NumPy/Pandas/EDA/Matplotlib exercises) | ✅ Done |
| 4 | Backend: Express + Prisma + SQLite, migrate static content into DB, client fetches via API | ✅ Done |
| 5 | Auth (JWT register/login) + progress tracking (submissions, project status) across all 3 tracks | ✅ Done |
| 6 | Optional "real backend" modes for Interview/advanced exercises | Not started |
| 7 | Search/filter, polish, deploy | Not started |

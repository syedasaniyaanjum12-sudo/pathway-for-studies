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
| App database | PostgreSQL + Prisma ORM | Type-safe schema/queries; dev starts on SQLite via Prisma, switching to Postgres for deploy (see `docs/DEPLOY.md` for the actual procedure — not just a one-line config change). |
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

Phase 6 added a second, *server-side* grading path, used only for Interview-tier questions/exercises: the server independently re-runs the submission (sql.js on the server for SQL, a sandboxed Python interpreter for Data Analytics) instead of just trusting the client's self-reported `isCorrect`. See "Trust boundary" below for exactly what this does and doesn't guarantee.

Phase 7 didn't touch the architecture — it added text search alongside the existing difficulty/level filters on all three track pages (client-side `.filter()` over already-fetched data; no new endpoints, since the content lists are small enough that fetching everything up front and filtering in memory is simpler than paginated/server-side search), an empty state for "search+filter matched nothing," a progress summary on the Home page, and made the app deploy-ready: `CORS_ORIGIN` (server) and `VITE_API_BASE_URL` (client) exist specifically so the client and server can live on different origins in production, which they can't in dev (same-origin via Vite's proxy). See `docs/DEPLOY.md` for the actual deploy procedure — not run by an agent, since it requires your own hosting accounts.

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
│   │   │   ├── AiProjects/
│   │   │   └── Login/
│   │   ├── components/            # Badge, CodeEditor, ResultTable, PythonResultView, VerificationNote, ...
│   │   ├── context/AuthContext.tsx
│   │   ├── lib/
│   │   │   ├── api.ts              # fetch wrappers for the Express API (Phase 4)
│   │   │   ├── authStorage.ts
│   │   │   ├── sqlEngine.ts        # sql.js wrapper (Phase 1) — execution logic lives in shared/sqlExec.ts
│   │   │   └── pythonEngine.ts     # Pyodide wrapper (Phase 3)
│   │   └── App.tsx
│   └── package.json
├── server/                         # Express + Prisma backend (Phase 4)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts                 # populates the DB from shared/data/*.ts
│   ├── python/                     # Phase 6: RestrictedPython sandbox for server-side DA re-grading
│   │   ├── run_sandboxed.py
│   │   └── requirements.txt
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   ├── auth.ts
│   │   │   ├── sqlEngine.ts        # Phase 6: server-side sql.js re-grading engine (Interview-tier only)
│   │   │   └── pythonSandbox.ts    # Phase 6: spawns run_sandboxed.py, re-grades (Interview-tier only)
│   │   ├── middleware/requireAuth.ts
│   │   ├── routes/                 # sql-questions, data-analytics-exercises, ai-projects, auth, me/progress
│   │   └── index.ts
│   └── package.json
├── shared/                         # types + content + grading logic shared by client and server
│   ├── types.ts
│   ├── sqlExec.ts                  # the actual "run this SQL against this db" logic — one copy, both engines
│   ├── grading/{sqlGrading,pythonGrading}.ts  # result-comparison logic — one copy, both engines
│   └── data/                       # sqlQuestions.ts, dataAnalyticsExercises.ts, aiProjects.ts — human-edited source of new content
├── datasets/                       # seed .sql / .csv files: Employees, Departments, Customers, Orders, Products, Sales
└── docs/
    ├── PLAN.md                      # this file
    └── DEPLOY.md                    # Phase 7: step-by-step Vercel + Render deployment
```

## Database Plan

**Practice datasets** (the subject of exercises) — plain seed files for Employees, Departments, Customers, Orders, Products, Sales, loaded client-side per exercise.

**App database** (SQLite for dev, Postgres for prod — same `schema.prisma` model definitions either way, just a different `datasource` provider + `DATABASE_URL`). The `provider` line itself is one-line, but don't stop there: Prisma migration files are provider-specific SQL, and `prisma/migrations/migration_lock.toml` records which one generated them — switching providers means regenerating migration history from scratch, not just editing the schema. See `docs/DEPLOY.md` (Phase 7) for the exact procedure, checked against this repo's actual `migration_lock.toml` rather than assumed.

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

**Trust boundary, stated plainly, updated for Phase 6:** for Easy/Medium/Hard questions/exercises, grading still happens entirely client-side (sql.js/Pyodide) and the submission endpoints just record whatever `isCorrect` the client reports — a learner could technically POST `isCorrect: true` without solving anything. For a learning tool with no certification value at stake, that's an acceptable trade-off (the same one made in Phase 4 when solution code was exposed to the client at all).

For **Interview-tier** questions/exercises, Phase 6 closes that gap: the server independently re-runs the submission itself (never trusting the client's report) and its own `isCorrect` is authoritative. Two engines, deliberately different in how "safe to run arbitrary submitted code" is achieved:

- **SQL** (`server/src/lib/sqlEngine.ts`): sql.js again, same as the browser, in a fresh in-memory database per request. This is safe *by construction* — sql.js has no filesystem or network access of its own, so there's no escape surface to defend, regardless of how malicious the submitted SQL is.
- **Python** (`server/python/run_sandboxed.py`, invoked via `server/src/lib/pythonSandbox.ts`): a `RestrictedPython`-compiled sandbox with `safer_getattr` (blocks the classic `().__class__.__bases__[0].__subclasses__()`-style escape to unrestricted code) and no `import` of anything not explicitly provided, plus a hard subprocess timeout. **This is real protection against casual misuse, not container-grade isolation** — the subprocess still runs as the same OS user as the server. Verified directly (not just asserted): `().__class__.__bases__[...]`, `import os`, and `open(...)` are all rejected at compile-time or NameError at exec-time; an infinite loop times out after 10s rather than hanging the server. Do not expose this to untrusted users on the open internet without real container/VM isolation in front of it — see the security-posture comment at the top of `run_sandboxed.py` for the full reasoning.

If the Python sandbox isn't installed on a given deployment (`python -m pip install -r server/python/requirements.txt`), Interview-tier Data Analytics submissions degrade gracefully to the client-trust path (`gradedBy: 'client'`, with a `serverNote` explaining why) rather than failing outright — checked once per server process via `isPythonSandboxAvailable()`, not per-request.

A `SubmissionResult` response (`{id, isCorrect, gradedBy, serverNote?}`) tells the client which path graded a given attempt; the UI shows a "🔒 Server-verified" badge when `gradedBy === 'server'`, and reconciles its own (client-computed) verdict to match if the two ever disagree.

## Development Phases

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold, tooling, routed empty pages | ✅ Done |
| 1 | SQL Practice MVP (≥20 questions, sql.js, seeded datasets) | ✅ Done |
| 2 | AI Projects MVP (static cards, 4 levels) | ✅ Done |
| 3 | Data Analytics MVP (Pyodide, NumPy/Pandas/EDA/Matplotlib exercises) | ✅ Done |
| 4 | Backend: Express + Prisma + SQLite, migrate static content into DB, client fetches via API | ✅ Done |
| 5 | Auth (JWT register/login) + progress tracking (submissions, project status) across all 3 tracks | ✅ Done |
| 6 | Server-side re-grading for Interview-tier questions/exercises (sql.js + RestrictedPython sandbox) | ✅ Done |
| 7 | Search/filter, polish, deploy-readiness (see `docs/DEPLOY.md`) | ✅ Done |

## Bugs found by actually running the app in a browser

Everything above was verified by direct API calls, Node-based logic checks, or `npm run build`/`tsc` — none of which exercise a real browser. Driving the app end-to-end with Playwright (see below) surfaced two real bugs that all of that verification had missed:

1. **sql.js WASM 404 in the browser (Phase 1).** `client/public/` had `sql-wasm.wasm` (the `main`-field build's file), but Vite resolves sql.js's package.json `browser` field, which loads `sql-wasm-browser.js` — that file requests `sql-wasm-browser.wasm` instead. The mismatch was invisible because the Phase 1 verification scripts ran sql.js directly under Node, which ignores the `browser` field entirely. Fixed by copying the correct (byte-identical, just differently-named) file.
2. **Data Analytics grading race condition (Phase 3).** `runPython()` passed the code/checkVar/datasets to Python via `pyodide.globals.set()` on the one shared Pyodide interpreter, then read them back inside an `eval`'d string. `DataAnalytics.tsx` grades a submission by running the learner's code and the solution *concurrently* (`Promise.all`) — so the second call's `globals.set()` could overwrite the first call's arguments before they were read, causing the learner's code to be silently graded as the solution (always "Correct!", displaying the solution's output). This could only surface under real concurrent execution — a sequential Node script, however faithful, can't reproduce it. Fixed by fetching the Python-side grading function once and calling it directly with arguments (each call gets its own local Python scope) instead of routing arguments through shared global state.

Takeaway kept for future phases: logic verification (Node scripts, direct API calls) and actually running the app are different kinds of evidence — one catches wrong logic, the other catches wrong wiring and concurrency. Both are worth doing, and neither substitutes for the other.

## Bugs found while building Phase 6

3. **Off-by-one relative path to `datasets/` (server-side).** `server/src/lib/sqlEngine.ts` and `server/src/lib/pythonSandbox.ts` both need to reach the repo-root `datasets/` folder from `server/src/lib/` — 3 directories deep, so exactly 3 `../` gets there. Both were written with 4 `../` on the first pass (one level too many). `sqlEngine.ts`'s mistake was caught immediately since every test case touches the seed data. `pythonSandbox.ts`'s mistake was **not** caught by the first two test cases (both dataset-free — `np.arange` needs no CSV) and only surfaced on the third, dataset-backed test (`FileNotFoundError` reading `employees.csv`). Lesson reinforced: a passing test suite only proves what it actually exercises — the trivial case first is fine for a quick sanity check, but declaring victory there would have shipped a broken path for every dataset-backed Interview exercise.
4. **`print()` inside RestrictedPython needs its own protocol, not a builtins patch.** First attempt exposed `print` by patching `restricted_globals['__builtins__']['print'] = print`, on the assumption that restricted code just looks up `print` as a normal builtin. It doesn't: `compile_restricted` rewrites every `print(...)` call at the AST level to go through a `_print_`-provided collector object regardless of what's in `__builtins__`, so the builtins patch was silently dead code and any submission with a `print()` call crashed with `NameError: name '_print_' is not defined`. Fixed by wiring RestrictedPython's actual `PrintCollector` mechanism and reading the accumulated text back via `printer()` (a callable, not `str(printer)` — its `__str__` isn't overridden, only `__call__`, so `str()` returns the default object repr instead of the printed text — caught only by actually checking the JSON output, not by the absence of a crash).

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
| 8 | RPG career progression: XP, Levels 0-10, skills unlocked | ✅ Done (Phase 1 of the gamification plan below) |
| 9 | World Map: 11 Worlds grouping all content into a leveled career path | ✅ Done (Phase 2 of the gamification plan below) |
| 10 | Quizzes & Mini Challenges: 11 concept quizzes, 7 timed challenges | ✅ Done (Phase 3 of the gamification plan below) |
| 11 | Boss Challenges: 7 multi-part per-World capstones | ✅ Done (Phase 4 of the gamification plan below) |

## Gamification plan: RPG career progression (LEVEL 0 → LEVEL 10)

The goal: a learner should feel like they're playing a career-building RPG, starting at **LEVEL 0 — Beginner** and progressing to **LEVEL 10 — Job-Ready AI Engineer**. Rather than building this as a parallel system with its own content, it's layered on top of the three existing tracks — SQL Practice, Data Analytics, and AI Engineer Projects already have everything an XP system needs (`Difficulty`, `topic`, `ProjectLevel`, `skills[]`), so Phase 1 required zero new content authoring. Later phases add real new content (quizzes, mini challenges, boss challenges) incrementally, one topic at a time, rather than all at once.

| Phase | Deliverable | Status |
|---|---|---|
| 1 | **XP & Level engine.** XP per solved question/exercise (by `Difficulty`) and per completed AI Project (by `ProjectLevel`); 11 levels (0-10) with titles and cumulative XP thresholds; "skills unlocked" derived from topics/project skills already touched; surfaced via `GET /api/me/progress` and a Home-page RPG banner. | ✅ Done |
| 2 | **World Map.** Regroup the three tracks' content into 11 "Worlds" (topic/level clusters, `shared/data/worlds.ts`), each advisory-gated behind a Level — locked worlds stay visible with a 🔒 and "Reach Level N" hint rather than being hidden, and every world links into its track page pre-filtered to that world's content via `?world=<id>`. New `/world-map` page + nav link, additive to (not replacing) Home. | ✅ Done |
| 3 | **Quizzes & Mini Challenges.** One 4-question concept quiz per World (11 total) and one timed Mini Challenge per practicable World (7 total, SQL/Data Analytics only) — new DB models (`Quiz`, `QuizAttempt`, `MiniChallenge`, `MiniChallengeAttempt`), new routes, new `/quiz/:worldId` and `/mini-challenge/:worldId` pages linked from World Map cards. | ✅ Done |
| 4 | **Boss Challenges.** One harder, multi-part capstone per practicable World (7 total, SQL/Data Analytics only, same population as Mini Challenges) — new content (not a rehash of an existing question), new `BossChallenge`/`BossChallengeAttempt` models, new `/boss-challenge/:worldId` page with a depleting "Boss HP" bar, linked from World Map cards, which show a "🏆 World Complete" badge once defeated. | ✅ Done |
| 5 | **Badges/streaks + the full game loop.** Achievement badges beyond "World Complete" (e.g. perfect quiz, speed-run Mini Challenge), daily/activity streak tracking, and the full Concept → Why It Matters → Visual Explanation → Practice loop authored per topic — deliberately deferred: streaks need new activity-timestamp tracking this app doesn't have yet, and the full lesson-authoring loop is, as originally scoped, "the biggest content lift, done incrementally rather than all at once," not a single phase. | Not started |

### Phase 1 design decisions

**XP values** (`shared/data/levels.ts`): `Easy=10, Medium=20, Hard=35, Interview=60` for both SQL Practice and Data Analytics (they share the same `Difficulty` type and comparable per-tier effort). AI Projects award `Beginner=30, Intermediate=60, Advanced=120, Portfolio=250` XP, but **only on `status: 'done'`** — an `in-progress` project hasn't been completed, so it earns no XP (unlike "skills unlocked," which does count `in-progress`; see below). Checked against today's actual content (24 SQL questions, 19 exercises, 20 projects): finishing everything caps out around 3500 XP, comfortably clearing the Level 10 threshold (2900) without requiring literally every project to be `done`.

**Level thresholds** are spaced to escalate: clearing every Easy/Medium question alone gets a learner to roughly Level 2-3; Levels 4+ increasingly require Hard/Interview questions and completed projects, not just volume — the RPG feel of later levels taking real effort, not just repetition.

**"Skills unlocked"** = the union of topics from solved SQL questions/exercises, plus the `skills[]` of any AI Project that's at least `in-progress` (not just `done`) — a skill starts developing before a project is finished, which is a deliberately different rule from XP (completion-only). This reused `AiProject.skills` as-is rather than inventing a new skill taxonomy.

**Computed, not stored.** Like the existing "has this learner solved X" check, XP/level/skills are computed at query time from the same submission/status tables `GET /api/me/progress` already read — no new mutable "totalXp" column that could drift from the underlying attempt log. `computeLevelProgress()` (`shared/data/levels.ts`) is a pure function (`totalXp -> level info`) so the curve has one source of truth.

### Phase 2 design decisions

**Worlds are a lens, not new content.** `shared/data/worlds.ts` defines 11 `WorldDef`s, each an OR'd list of SQL/Data Analytics `topic`s or a single AI Projects `ProjectLevel`, ordered into a career path (SQL fundamentals → data wrangling → SQL patterns/cleaning in parallel → EDA/viz → advanced SQL alongside first AI builds → increasingly senior AI Engineer work → portfolio capstones) and given an `unlockLevel` (0-10, matching the Phase 1 curve). Every one of the 12 SQL topics and 6 Data Analytics topics is covered by exactly one world — checked directly against `shared/data/sqlQuestions.ts`/`dataAnalyticsExercises.ts`, not assumed.

**Locking is advisory, not enforced.** A locked world (`currentLevel < unlockLevel`) renders dimmed with a 🔒 and "Reach Level N to unlock (K items waiting)," and is **not** a clickable link — but nothing stops a learner from opening SQL Practice/Data Analytics/AI Projects directly from the nav and doing any question regardless of world lock state, exactly as before Phase 2. The World Map's gate is purely a motivational path metaphor layered on top of an app that has never hard-gated content (every difficulty tier has always been freely browsable). Signed-out learners see the map at an implicit Level 0 (unlocking only the first world) rather than the page being hidden or erroring.

**Deep-linking, not duplicated UI.** Clicking an unlocked world navigates to its track page with `?world=<id>` (e.g. `/sql-practice?world=sql-foundations`), which reads the world's `topics`/`projectLevel` and applies it as an *additional* filter on top of the page's existing difficulty/level filter and search box (Phase 7) — shown as a dismissible "🗺️ World: <title> · Clear" banner. This reuses the exact list/filter UI already on each track page instead of building a second question-browsing surface.

**Per-world progress, computed client-side.** The World Map fetches the same four endpoints Home already does (`sql-questions`, `data-analytics-exercises`, `ai-projects`, `me/progress`) and buckets them into worlds in the browser — no new API endpoint, since a world is just a filter over content that was already being fetched in full.

### Phase 3 design decisions

**1:1 with Worlds, not a parallel taxonomy.** Every `Quiz` and `MiniChallenge` id *is* a `WorldDef.id` (`shared/data/quizzes.ts`, `shared/data/miniChallenges.ts`) — no separate `worldId` field, no separate lookup table. `/quiz/:worldId` and `/mini-challenge/:worldId` resolve directly. All 11 Worlds get a Quiz (4 multiple-choice questions each, testing concept recognition — a different, complementary skill from writing code); only the 7 SQL/Data Analytics Worlds get a Mini Challenge, since AI Projects Worlds have no single gradable artifact to put a clock on.

**Quizzes reversed the usual trust-boundary trade rather than copying it.** SQL/Data Analytics content ships its solution to the client upfront and trusts the client's self-reported `isCorrect` for anything below Interview-tier (see the Phase 5/6 notes above) — re-executing code server-side is the expensive part, reserved for Interview-tier only. Grading a multiple-choice answer is cheap by comparison, so quizzes get the better of both worlds instead of picking one: `GET /api/quizzes` ships the full answer key (same trust model as SQL/DA, and the reason a signed-out learner can take a quiz at all — there's nothing to gate it behind), but `POST /api/quizzes/:id/attempts` **always** independently re-grades and persists server-side rather than trusting the client's report, because there was no real cost to doing so properly.

**Mini Challenges add a clock, not a second grading engine.** A `MiniChallenge` wraps an *existing* `SqlQuestion`/`DataAnalyticsExercise` by `refId` — solving it reuses that question's own grading (sql.js/Pyodide client-side) and even calls the normal `submitSqlQuestion`/`submitDataAnalyticsExercise` endpoints so it counts as a real solve on that track too, not a separate content pool. `POST /api/mini-challenges/:id/attempts` takes the client-reported `isCorrect` (same trust boundary as the underlying question) plus `elapsedSeconds`, and computes `succeeded = isCorrect && elapsedSeconds <= timeLimitSeconds` — the timing check is the only thing this endpoint actually adds. Running out of time doesn't block further attempts (the learner can keep practicing), it just means that attempt won't count as a success.

**XP additions, not new thresholds.** `XP_PER_QUIZ_PASS = 15` and `XP_PER_MINI_CHALLENGE = 25` (`shared/data/levels.ts`) — both smaller than solving even an Easy question's full-difficulty XP scale would suggest, since a quiz is a quick concept check and a Mini Challenge is the same question the learner may have already solved once. Checked against the existing Level curve: adding every quiz/challenge's XP to the Phase 1 max (~3530) brings the ceiling to ~3870, still comfortably above the Level 10 threshold (2900) — no threshold needed adjusting.

### Phase 4 design decisions

**Boss Challenges are new content, not a rehash.** Unlike a Mini Challenge (an existing question plus a clock), each `BossChallengePart` is hand-authored new material combining multiple topics from its World — e.g. the `sql-aggregates-joins` boss joins two tables *and* groups *and* orders in one query, harder than any single practice question in that World. Same 1:1-with-`WorldDef.id` convention as Quiz/MiniChallenge, and the same scope boundary: only the 7 SQL/Data Analytics Worlds get one, for the same reason Mini Challenges stop there — no single gradable artifact exists for an AI Projects World to put a multi-part fight on top of.

**All parts, one sitting, tracked client-side.** A learner's per-part correctness lives in local component state (`correctPartIds`) as they solve each part with the same sql.js/Pyodide grading every other question uses — the boss is "defeated" the moment every part in `challenge.parts` has been solved once, shown as a depleting "Boss HP" bar rather than a single pass/fail like a Quiz. There's no partial credit or resume-across-sessions: closing the page mid-fight loses that progress, same as leaving a normal question half-written.

**Structural validation, not blind trust — because real re-grading isn't available.** The server has no execution sandbox for Boss Challenge content the way Interview-tier questions do (that infrastructure is scoped to the existing SqlQuestion/DataAnalyticsExercise re-grading paths, not extended here), so `POST /api/boss-challenges/:id/attempts` can't independently verify *that* a submitted query/code was actually correct. What it does check: the reported `correctPartIds` are real part ids belonging to that specific challenge, deduplicated, and covering literally every part (`correctCount === totalCount`) before marking it `defeated` — closer to the Quiz endpoint's "verify what's cheap to verify" philosophy than the plain self-report trust MiniChallenge uses, even though full re-execution wasn't in scope.

**XP and the "World Complete" badge.** `XP_PER_BOSS_CHALLENGE = 50` — the single largest per-world reward, double a Mini Challenge, reflecting that it's the hardest content in that World. Defeating a Boss Challenge also flips a distinct "🏆 World Complete" badge on that World's Map card (amber border, separate from the Quiz/Mini Challenge ✅ checkmarks) — checked directly: since World Map locking is advisory only (Phase 2), this badge can show on a still-locked World if a learner jumps straight to `/boss-challenge/:worldId` before reaching its `unlockLevel`, which is correct, not a bug — nothing in this app hard-gates content, so the badge should reflect what's actually true (defeated) regardless of what the map's lock icon is signaling.

## Bugs found by actually running the app in a browser

Everything above was verified by direct API calls, Node-based logic checks, or `npm run build`/`tsc` — none of which exercise a real browser. Driving the app end-to-end with Playwright (see below) surfaced two real bugs that all of that verification had missed:

1. **sql.js WASM 404 in the browser (Phase 1).** `client/public/` had `sql-wasm.wasm` (the `main`-field build's file), but Vite resolves sql.js's package.json `browser` field, which loads `sql-wasm-browser.js` — that file requests `sql-wasm-browser.wasm` instead. The mismatch was invisible because the Phase 1 verification scripts ran sql.js directly under Node, which ignores the `browser` field entirely. Fixed by copying the correct (byte-identical, just differently-named) file.
2. **Data Analytics grading race condition (Phase 3).** `runPython()` passed the code/checkVar/datasets to Python via `pyodide.globals.set()` on the one shared Pyodide interpreter, then read them back inside an `eval`'d string. `DataAnalytics.tsx` grades a submission by running the learner's code and the solution *concurrently* (`Promise.all`) — so the second call's `globals.set()` could overwrite the first call's arguments before they were read, causing the learner's code to be silently graded as the solution (always "Correct!", displaying the solution's output). This could only surface under real concurrent execution — a sequential Node script, however faithful, can't reproduce it. Fixed by fetching the Python-side grading function once and calling it directly with arguments (each call gets its own local Python scope) instead of routing arguments through shared global state.

Takeaway kept for future phases: logic verification (Node scripts, direct API calls) and actually running the app are different kinds of evidence — one catches wrong logic, the other catches wrong wiring and concurrency. Both are worth doing, and neither substitutes for the other.

## Bugs found while building Phase 6

3. **Off-by-one relative path to `datasets/` (server-side).** `server/src/lib/sqlEngine.ts` and `server/src/lib/pythonSandbox.ts` both need to reach the repo-root `datasets/` folder from `server/src/lib/` — 3 directories deep, so exactly 3 `../` gets there. Both were written with 4 `../` on the first pass (one level too many). `sqlEngine.ts`'s mistake was caught immediately since every test case touches the seed data. `pythonSandbox.ts`'s mistake was **not** caught by the first two test cases (both dataset-free — `np.arange` needs no CSV) and only surfaced on the third, dataset-backed test (`FileNotFoundError` reading `employees.csv`). Lesson reinforced: a passing test suite only proves what it actually exercises — the trivial case first is fine for a quick sanity check, but declaring victory there would have shipped a broken path for every dataset-backed Interview exercise.
4. **`print()` inside RestrictedPython needs its own protocol, not a builtins patch.** First attempt exposed `print` by patching `restricted_globals['__builtins__']['print'] = print`, on the assumption that restricted code just looks up `print` as a normal builtin. It doesn't: `compile_restricted` rewrites every `print(...)` call at the AST level to go through a `_print_`-provided collector object regardless of what's in `__builtins__`, so the builtins patch was silently dead code and any submission with a `print()` call crashed with `NameError: name '_print_' is not defined`. Fixed by wiring RestrictedPython's actual `PrintCollector` mechanism and reading the accumulated text back via `printer()` (a callable, not `str(printer)` — its `__str__` isn't overridden, only `__call__`, so `str()` returns the default object repr instead of the printed text — caught only by actually checking the JSON output, not by the absence of a crash).

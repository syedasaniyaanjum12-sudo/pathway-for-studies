---
name: run-pathway-for-studies
description: Build, run, seed, and drive the Pathway for Studies app (SQL Practice / Data Analytics / AI Engineer Projects, React+Vite client, Express+Prisma API). Use when asked to start the app, run it, take a screenshot of its UI, verify a change end-to-end, or check that grading (SQL/Python) still works after an edit.
---

This is a two-process web app (Vite client on :5173, Express+Prisma API on :4000, client proxies `/api` to the server — see `client/vite.config.ts`). There's no `chromium-cli` or connected browser extension in this environment, so it's driven with a small Playwright script: `.claude/skills/run-pathway-for-studies/driver.cjs`. All paths below are relative to the repo root.

## Prerequisites

Windows host, Git Bash shell, Node v24 + npm 11 (already present — no OS packages to install). One-time Playwright browser download for the driver:

```bash
cd .claude/skills/run-pathway-for-studies
npm install                      # installs playwright into this skill dir only — not a project dependency
npx playwright install chromium  # ~115MB the first time; no-op if already cached
```

## Setup (first time, or after a schema change)

```bash
npm run install:all   # from repo root — installs client/ and server/ deps
cd server
npx prisma migrate dev   # creates prisma/dev.db and applies the schema (prompts for a migration name only if the schema changed since the last migration)
npm run prisma:seed      # populates it from ../shared/data/*.ts — safe to re-run any time (upsert)
cd ..
```

`server/.env` needs `DATABASE_URL`, `PORT`, and `JWT_SECRET` — copy `server/.env.example` and fill in a random string for `JWT_SECRET` if `.env` doesn't exist yet.

Phase 6 (Interview-tier server-side re-grading) additionally needs Python + RestrictedPython/pandas/numpy on PATH for the server process:

```bash
python -m pip install -r server/python/requirements.txt
```

If that's not installed, Interview-tier submissions still work — the server detects the sandbox is unavailable and falls back to trusting the client's own grading (`gradedBy: 'client'`, with a `serverNote` explaining why) rather than failing. The SQL half of Phase 6 (server-side sql.js re-grading) has no extra setup — it's already a server dependency.

## Run (agent path)

Start both dev servers from the repo root, poll until both actually respond (don't fixed-`sleep` — the client's first Vite boot took ~11s in this environment), then run the driver:

```bash
npm run dev > /tmp/pathway-dev.log 2>&1 &
timeout 45 bash -c 'until curl -sf http://localhost:5173 >/dev/null 2>&1; do sleep 1; done'
timeout 20 bash -c 'until curl -sf http://localhost:4000/api/health >/dev/null 2>&1; do sleep 1; done'

cd .claude/skills/run-pathway-for-studies
node driver.cjs
```

The driver registers a throwaway user, then exercises one representative flow per track: SQL Practice (wrong query → correct query, sql.js grading), sign-up + progress persistence (solve a question, reload, confirm the checkmark survived — proves it round-tripped through the database, not just local state), AI Projects (set a status), Data Analytics (wrong code → correct code, Pyodide grading), and Phase 6's server-side re-grading for Interview-tier questions (a correct answer through the real UI shows the "Server-verified" badge; a raw `fetch()` call from the page context — the real UI can't lie about its own grading, so this is the only way to actually exercise the check — confirms the server overrides a dishonest `isCorrect: true` self-report to `false`). It exits 0 with `N browser console error(s)` printed (should be 0), or exits 1 and prints `DRIVER FAILED` with the Playwright error (or `REGRESSION: ...` for the Phase 6 trust-boundary check specifically) on any assertion/timeout failure.

Screenshots land in `.claude/skills/run-pathway-for-studies/screenshots/` (gitignored — regenerated each run):

| file | what it shows |
|---|---|
| `01-home.png` | Home page, three track cards |
| `02-sql-correct.png` | SQL Practice, a correct query graded ✅ |
| `03-sql-solved-after-reload.png` | Signed-in, solved-question checkmark surviving a full page reload |
| `04-ai-project-status.png` | AI Projects, a project's status dropdown set to "in-progress" |
| `05-python-correct.png` | Data Analytics, correct Python code graded ✅ |
| `06-sql-interview-verified.png` | SQL Practice, an Interview-tier question showing the "🔒 Server-verified" badge |

Stop the servers when done:

```bash
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { \$_.CommandLine -match 'vite' -or \$_.CommandLine -match 'tsx' } | ForEach-Object { Stop-Process -Id \$_.ProcessId -Force -ErrorAction SilentlyContinue }"
```

(`npm run dev` is `concurrently` wrapping two `npm --prefix` child processes; on Windows, killing the top-level backgrounded process doesn't reliably kill the `node` children, so kill by matching command line instead.)

## Run (human path)

```bash
npm run dev
```

Open http://localhost:5173. Ctrl-C to stop (works fine interactively; it's only the background+kill combination above that needs the PowerShell workaround).

## Test

No automated test suite yet (`client/`, `server/` each only have `build`/`typecheck` scripts — no unit/integration tests). `npm run build` (client) and `npm run typecheck` (server) both being clean is the current bar; the driver above is the closest thing to an integration test.

---

## Gotchas

- **sql.js's actual WASM filename depends on which package.json field the bundler resolves.** Vite picks sql.js's `browser` field (`sql-wasm-browser.js`), which requests `sql-wasm-browser.wasm` — not `sql-wasm.wasm` (the `main` field's file, byte-identical, just named differently). `client/public/` must have the former. A Node script that `require()`s sql.js directly won't catch a mismatch here, since Node ignores the `browser` field.
- **Data Analytics grading runs two Pyodide calls concurrently** (`Promise.all` in `DataAnalytics.tsx`: the learner's code and the solution). `client/src/lib/pythonEngine.ts` passes arguments to the shared Python interpreter as direct function-call arguments specifically to avoid a shared-globals race between those two concurrent calls (see `docs/PLAN.md` "Bugs found by actually running the app" for the full story). The driver's Data Analytics step exercises exactly this concurrent path — if it ever regresses, expect the driver to show "Correct!" for a deliberately wrong answer.
- **Killing `npm run dev`'s children on Windows**: `$!` after backgrounding only captures the `concurrently`/npm wrapper PID, not the actual `vite`/`tsx` node processes, and plain `kill` on that PID doesn't take the children with it. Match on command line instead (see the PowerShell one-liner above).
- **First Vite boot is slow** (~11s observed, dependency pre-bundling) — a `timeout 30` poll loop can be too tight; `timeout 45` was needed in this environment.
- **The relative-path arithmetic for reaching `datasets/` from `server/src/lib/*.ts` is easy to get off by one.** `server/src/lib/` is 3 directories deep from the repo root, so it takes exactly 3 `../` to get back out — `../../../datasets/...`, not 4. Got this wrong in both `sqlEngine.ts` and `pythonSandbox.ts` on the first pass; the Python one only surfaced when testing with a dataset-backed exercise (`ENOENT`/`FileNotFoundError` — the no-dataset test cases don't touch this code path at all, so they passed regardless).
- **A real UI can never exercise "does the server actually re-check this," only "did I compute the right answer."** The client always self-reports its own grading honestly — there's no UI control that submits a mismatched `isCorrect`. To test that Interview-tier server-side re-grading actually catches a lie (not just that the happy path works), the driver calls `fetch()` directly from the page context (`page.evaluate`) with a deliberately wrong query paired with `isCorrect: true`. That's a legitimate driving technique, not a hack — it's testing an API-level contract, and clicking through the UI structurally cannot reach it.

## Troubleshooting

- **`CompileError: WebAssembly.instantiate(): expected magic word ... found 3c 21 64 6f`** in the browser console on SQL Practice: that byte sequence is `<!do` — Vite's dev server served `index.html` (its SPA fallback) instead of a `.wasm` file, meaning the wasm file the browser actually requested is missing from `client/public/`. Check the Network tab (or a Playwright `response` listener) for the exact `.wasm` URL requested — it may not be the file you think it is (see Gotchas above).
- **`prisma:seed` fails with `Cannot find module '.../prisma/seed.ts'`**: this happens on the very first `prisma migrate dev` if `prisma/seed.ts` doesn't exist yet — harmless the first time (the migration itself still applies); create the seed script, then run `npm run prisma:seed` manually.
- **`npx prisma migrate dev` errors with `Environment variable not found: DATABASE_URL`** even though `.env` has it: `server/prisma.config.ts` (the newer Prisma config format) doesn't auto-load `.env` the way the legacy `package.json#prisma` field did — it needs an explicit `import 'dotenv/config'` at the top.

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

Two independent apps talking over a REST API, plus a shared types package:

```
Browser (React SPA)
   ├─ SQL Practice: loads a dataset into sql.js, runs queries locally, compares to expected result
   ├─ Data Analytics: runs Python via Pyodide, compares output/plot to expected result
   └─ AI Projects: browses/filters project cards
        │
        ▼  REST (fetch) — added Phase 4
Express API  ──────────────  PostgreSQL (via Prisma)
   (questions, exercises, projects, users, submissions, progress)
```

Phases 1-3 run without a backend at all (static JSON data), so the UI works before databases enter the picture.

## Folder Structure

```
pathway-for-studies/
├── client/                        # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home/
│   │   │   ├── SqlPractice/
│   │   │   ├── DataAnalytics/
│   │   │   └── AiProjects/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   └── PlaceholderSection/  # temporary; removed as each page gets real content
│   │   ├── data/                  # static question/exercise/project JSON (Phases 1-3)
│   │   ├── lib/
│   │   │   ├── sqlEngine.ts        # sql.js wrapper (Phase 1)
│   │   │   └── pythonEngine.ts     # Pyodide wrapper (Phase 3)
│   │   └── App.tsx
│   └── package.json
├── server/                        # Express backend (added Phase 4)
├── shared/                        # shared TypeScript types (added when server exists)
├── datasets/                      # seed .sql / .csv files: Employees, Departments, Customers, Orders, Products, Sales
└── docs/
```

## Database Plan

**Practice datasets** (the subject of exercises) — plain seed files for Employees, Departments, Customers, Orders, Products, Sales, loaded client-side per exercise.

**App database** (Postgres via Prisma, added Phase 4):

```
User                    (id, email, passwordHash, createdAt)
SqlQuestion             (id, title, difficulty[Easy|Medium|Hard|Interview], datasetName,
                         prompt, solutionQuery, expectedResultHash, hints[], tags[])
DataAnalyticsExercise   (id, title, difficulty[Easy|Medium|Hard|Interview],
                         topic[NumPy|Pandas|DataCleaning|MissingValues|EDA|Matplotlib],
                         datasetName, prompt, starterCode, solutionCode, hints[])
AiProject               (id, title, level[Beginner|Intermediate|Advanced|Portfolio],
                         description, techStack[], starterRepoUrl)
SqlSubmission           (id, userId, questionId, submittedQuery, isCorrect, submittedAt)
UserProjectStatus       (id, userId, projectId, status[not-started|in-progress|done])
```

## Development Phases

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Scaffold, tooling, routed empty pages | ✅ Done |
| 1 | SQL Practice MVP (≥20 questions, sql.js, seeded datasets) | ✅ Done |
| 2 | AI Projects MVP (static cards, 4 levels) | Not started |
| 3 | Data Analytics MVP (Pyodide, NumPy/Pandas/EDA/Matplotlib exercises) | Not started |
| 4 | Backend: Express + Prisma + Postgres, migrate static content into DB | Not started |
| 5 | Auth + progress tracking | Not started |
| 6 | Optional "real backend" modes for Interview/advanced exercises | Not started |
| 7 | Search/filter, polish, deploy | Not started |

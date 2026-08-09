# Pathway for Studies

A learning platform with three tracks:

- **SQL Practice** — Easy/Medium/Hard/Interview questions, run entirely in-browser against seeded sample datasets (Employees, Departments, Customers, Orders, Products, Sales).
- **Data Analytics** — NumPy/Pandas/EDA/Matplotlib exercises, run entirely in-browser via Pyodide.
- **AI Engineer Projects** — a project catalog across Beginner/Intermediate/Advanced/Portfolio levels.

See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture, tech stack, folder structure, and phased build-out plan.

## Development

```bash
cd client
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

## Status

**Phase 1 complete** — SQL Practice is functional: 24 questions (Easy/Medium/Hard/Interview) across joins, CASE WHEN, string/date functions, window functions, views, indexes, and subqueries, running entirely in-browser via sql.js against a seeded sample database. Data Analytics and AI Engineer Projects are still placeholders (Phases 2–3).

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

**Phase 2 complete** — SQL Practice (24 questions, sql.js) and AI Engineer Projects (20 projects across Beginner/Intermediate/Advanced/Portfolio, with a shared `Badge` component reused for both difficulty and level tags) are both functional. Data Analytics is still a placeholder (Phase 3).

# Deployment

This app splits cleanly into two deployable pieces: a static frontend (`client/`) and a small API + database (`server/`). Recommended pairing — free tiers of both are enough for a personal learning app:

- **Client** → [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (static Vite build)
- **Server + Postgres** → [Render](https://render.com) or [Railway](https://railway.app) (Node service + managed Postgres)

Nothing below has been deployed by an agent — deploying means creating accounts and logging into third-party services, which only you can do. This is the exact sequence to run yourself; every command in it has been run and verified locally in this repo (the migration-regeneration step, especially, was checked against `server/prisma/migrations/migration_lock.toml`, not assumed).

## 1. Switching the database from SQLite to Postgres

The `docs/PLAN.md` architecture note says swapping `schema.prisma`'s `datasource provider` is "one line" — true for the schema file, **but not the whole story**: Prisma migration files contain provider-specific SQL, and `server/prisma/migrations/migration_lock.toml` literally records `provider = "sqlite"`. Pointing that schema at Postgres without regenerating migrations will fail the first time `prisma migrate deploy` tries to run SQLite-flavored SQL against a Postgres server.

Correct procedure (do this once, before your first deploy):

```bash
cd server
# 1. Get a real Postgres connection string — easiest is to spin up Render's
#    free Postgres instance first (see step 2) and copy its "External
#    Database URL", or use any local Postgres (`docker run -p 5432:5432 -e
#    POSTGRES_PASSWORD=dev postgres` works fine for generating migrations).

# 2. Point schema.prisma at Postgres:
#    change `provider = "sqlite"` to `provider = "postgresql"` in
#    prisma/schema.prisma's datasource block.

# 3. Delete the old SQLite-flavored migration history and regenerate it
#    against the real Postgres connection:
rm -rf prisma/migrations
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init

# 4. Commit the regenerated prisma/migrations/ folder (now Postgres-flavored).
```

From here on, deploys run `npx prisma migrate deploy` (applies pending migrations, no prompts — safe for CI/deploy hooks) instead of `migrate dev`.

## 2. Server + Postgres on Render

1. **New → PostgreSQL** — create a free Postgres instance, copy its "Internal Database URL" (for the web service, same region) and "External Database URL" (for running migrations from your machine, step 1 above).
2. **New → Web Service** — connect this repo, set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npx prisma migrate deploy && npm start`
     (running migrations as part of start is the simplest approach for a low-traffic personal app; a real production setup would run migrations as a separate release step instead)
   - **Environment variables**: `DATABASE_URL` (the Internal Database URL from step 1), `JWT_SECRET` (a long random string — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` generates one), `CORS_ORIGIN` (the client's deployed URL — set this *after* step 3, then redeploy), `PORT` (Render sets this automatically; the server already reads `process.env.PORT`).
3. **Python sandbox (optional):** Render's default Node runtime doesn't have Python. Either switch this service to Render's Docker runtime with a Dockerfile that installs both Node and Python + `server/python/requirements.txt`, or skip it — Interview-tier Data Analytics submissions degrade gracefully to client-side trust when the sandbox isn't available (see `server/src/lib/pythonSandbox.ts`'s `isPythonSandboxAvailable` check), so this is a real optional step, not a blocker.
4. Once deployed, run the seed script once against the production database: `DATABASE_URL="<external URL>" npm run prisma:seed` from your machine.

## 3. Client on Vercel

1. **New Project** → import this repo, set:
   - **Root Directory**: `client`
   - **Framework Preset**: Vite (auto-detected)
   - **Environment variable**: `VITE_API_BASE_URL` = your Render service's URL (e.g. `https://pathway-api.onrender.com`, no trailing slash) — see `client/src/lib/api.ts` for how this is used; it's what makes the client's relative `/api/...` calls resolve correctly when the client and server are on different origins in production (in dev, this is unset and Vite's proxy handles it instead — see `client/vite.config.ts`).
2. Deploy. Then go back to Render and set `CORS_ORIGIN` to this Vercel URL, and redeploy the server — until that's set, the deployed client's requests will be blocked by CORS.

## 4. Smoke-test the live deployment

Same idea as the local `run-pathway-for-studies` skill (`.claude/skills/run-pathway-for-studies/`), pointed at the real URLs instead of localhost:

```bash
curl https://pathway-api.onrender.com/api/health
curl https://pathway-api.onrender.com/api/sql-questions | head -c 200
```

Then open the Vercel URL in a browser and run through the same flows the skill's driver covers: solve a question, sign up, reload and confirm the checkmark persisted, try an Interview-tier question and confirm the "Server-verified" badge appears (or check Render's logs for `isPythonSandboxAvailable` reporting `false` if the Python-optional step above was skipped — that's expected, not a bug).

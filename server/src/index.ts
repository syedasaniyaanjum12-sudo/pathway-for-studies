import express from 'express'
import cors from 'cors'
import { sqlQuestionsRouter } from './routes/sqlQuestions.js'
import { dataAnalyticsExercisesRouter } from './routes/dataAnalyticsExercises.js'
import { aiProjectsRouter } from './routes/aiProjects.js'
import { authRouter } from './routes/auth.js'
import { progressRouter } from './routes/progress.js'
import { quizzesRouter } from './routes/quizzes.js'
import { miniChallengesRouter } from './routes/miniChallenges.js'
import { bossChallengesRouter } from './routes/bossChallenges.js'

const app = express()
const port = Number(process.env.PORT) || 4000

// Permissive CORS (the default, when CORS_ORIGIN is unset) is fine even
// with auth in the picture: sessions are Bearer tokens in an Authorization
// header, not cookies, so a cross-origin page can't silently ride a
// logged-in user's session the way it could with cookie auth — it would
// need the token itself, which CORS doesn't leak. For a real deployment
// (Phase 7), set CORS_ORIGIN to the deployed client's exact origin anyway —
// defense in depth costs nothing here, and it's one env var away. Accepts a
// comma-separated list for the (uncommon) case of multiple client origins.
const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin.split(',').map((o) => o.trim()) } : undefined))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/sql-questions', sqlQuestionsRouter)
app.use('/api/data-analytics-exercises', dataAnalyticsExercisesRouter)
app.use('/api/ai-projects', aiProjectsRouter)
app.use('/api/quizzes', quizzesRouter)
app.use('/api/mini-challenges', miniChallengesRouter)
app.use('/api/boss-challenges', bossChallengesRouter)
app.use('/api/me/progress', progressRouter)

// Express 5 forwards rejected promises from async route handlers here
// automatically — no per-route try/catch needed for the queries in this app.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

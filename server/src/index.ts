import express from 'express'
import cors from 'cors'
import { sqlQuestionsRouter } from './routes/sqlQuestions.js'
import { dataAnalyticsExercisesRouter } from './routes/dataAnalyticsExercises.js'
import { aiProjectsRouter } from './routes/aiProjects.js'

const app = express()
const port = Number(process.env.PORT) || 4000

// Permissive CORS is fine here: every endpoint is read-only public content
// (no auth yet — that's Phase 5), so there's nothing a cross-origin request
// could do that a same-origin one couldn't already.
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/sql-questions', sqlQuestionsRouter)
app.use('/api/data-analytics-exercises', dataAnalyticsExercisesRouter)
app.use('/api/ai-projects', aiProjectsRouter)

// Express 5 forwards rejected promises from async route handlers here
// automatically — no per-route try/catch needed for the read-only queries
// in this phase.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

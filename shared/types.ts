// Types shared between client and server. Both the Express API (via Prisma)
// and the React app import these instead of each defining their own copy —
// the whole point of this package existing once a real backend does.

export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Interview'

export interface SqlQuestion {
  id: string
  title: string
  difficulty: Difficulty
  topic: string
  prompt: string
  solutionQuery: string
  /** True when row order is part of a correct answer (e.g. the query itself
   * requires ORDER BY/LIMIT). Otherwise results are compared as sets. */
  orderMatters?: boolean
  hint: string
}

export interface DatasetBinding {
  /** Python variable name the CSV should be loaded into, e.g. 'employees_df'. */
  variable: string
  /** Path on the Pyodide virtual filesystem, e.g. '/data/employees.csv'. */
  file: string
}

export interface DataAnalyticsExercise {
  id: string
  title: string
  difficulty: Difficulty
  topic: string
  prompt: string
  datasets: DatasetBinding[]
  solutionCode: string
  hint: string
  /** True when the point of the exercise is a chart — the UI renders the
   * plot alongside the verdict. Grading still uses `result` either way. */
  expectsPlot?: boolean
}

export type ProjectLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Portfolio'

export interface AiProject {
  id: string
  title: string
  level: ProjectLevel
  description: string
  techStack: string[]
  skills: string[]
}

// --- Phase 5: auth + progress tracking ---

export interface AuthUser {
  id: string
  email: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export type ProjectStatus = 'not-started' | 'in-progress' | 'done'

/** Response shape of GET /api/me/progress — everything the UI needs to
 * render checkmarks/status across all three tracks in one request. */
export interface ProgressSummary {
  solvedSqlQuestionIds: string[]
  solvedExerciseIds: string[]
  projectStatuses: Record<string, ProjectStatus>
}

// --- Phase 6: server-side re-grading for Interview-tier questions ---

/** Response shape of POST .../submissions. For Easy/Medium/Hard, the server
 * just records whatever `isCorrect` the client (which already graded the
 * attempt itself, in-browser) reported — see docs/PLAN.md's Phase 5 note on
 * that trust boundary. For Interview-tier questions/exercises, the server
 * independently re-executes the submission (sql.js on the server for SQL, a
 * RestrictedPython sandbox for Python) and `gradedBy: 'server'` reflects
 * that its own `isCorrect` is authoritative, not just relayed. `gradedBy`
 * falls back to 'client' (with `serverNote` explaining why) if server-side
 * re-grading itself couldn't run — e.g. the Python sandbox isn't installed
 * on this deployment — so an infra gap never blocks a learner from seeing a
 * result. */
export interface SubmissionResult {
  id: string
  isCorrect: boolean
  gradedBy: 'client' | 'server'
  serverNote?: string
}
